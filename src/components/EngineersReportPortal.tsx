import React, { useState, useEffect } from 'react';
import { Initiative, EngineerSubmissionReport, FieldReport, EngineerAssignment, UserRole } from '../types';
import { إنشاء_الملف_التنفيذي_للمبادرة } from '../utils/developmentDecisionEngine';
import SmartFieldAssessmentPortal from './SmartFieldAssessmentPortal';
import { 
  HardHat, 
  Send, 
  Archive, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  Building2, 
  Ruler, 
  AlertTriangle, 
  Image as ImageIcon, 
  Camera,
  Check, 
  UserCheck, 
  RefreshCw, 
  Search, 
  Filter, 
  Sparkles, 
  ChevronLeft,
  ShieldCheck,
  Plus,
  Users,
  MapPin,
  CheckSquare,
  Edit,
  Trash2,
  ListTodo,
  AlertCircle,
  Eye,
  UserPlus,
  Lock,
  Unlock,
  Building,
  Layers,
  Phone
} from 'lucide-react';

interface EngineersReportPortalProps {
  initiatives: Initiative[];
  onUpdateInitiative: (updatedInitiative: Initiative) => void;
  userRole?: UserRole | 'admin' | 'visitor';
  targetInitiativeId?: string | null;
}

const SAMPLE_FIELD_REPORTS: EngineerSubmissionReport[] = [
  {
    id: "eng_rep_1",
    engineerName: "م. عيسى ناجي القادري",
    engineerPhone: "777123456",
    district: "مديرية ذي السفال",
    subDistrict: "عزلة ريدة ورياد",
    village: "قرية الخريف",
    initiativeId: "init_dhi_as_sufal_1",
    initiativeName: "مشروع رصف طريق الخريف - ذي السفال",
    date: new Date().toISOString().split('T')[0],
    pavedMetersToday: 120,
    cementUsedBags: 45,
    qualityScore: 96,
    obstacles: "لا توجد عوائق، التزام ممتاز من الأهالي بخلط الخرسانة والرش بالماء",
    notes: "تم التأكد من تركيب فواصل التمدد كل 3.5 أمتار وتغطية الرصف بالخيش الرطب",
    photoUrl: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80",
    photoBeforeUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
    photoAfterUrl: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80",
    status: "approved",
    submittedAt: new Date(Date.now() - 86400000).toISOString(),
    approvedAt: new Date().toISOString(),
    approvedBy: "إدارة التخطيط ووحدة التدخلات"
  },
  {
    id: "eng_rep_2",
    engineerName: "م. عادل صالح مقبل",
    engineerPhone: "773456789",
    district: "مديرية جبلة",
    subDistrict: "عزلة وراف",
    village: "قرية السايلة",
    initiativeId: "init_jiblah_1",
    initiativeName: "رصف عقبة السايلة - وراف",
    date: new Date().toISOString().split('T')[0],
    pavedMetersToday: 85,
    cementUsedBags: 30,
    qualityScore: 92,
    obstacles: "تأخر طفيف في وصول الشاحنة المحملة بالمواد وتصل المادة بنفس اليوم",
    notes: "تم توجيه الفرقة بدك التربة الأساسية جيداً قبل صب الخرسانة المسلحة",
    photoUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80",
    photoBeforeUrl: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80",
    photoAfterUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80",
    status: "pending",
    submittedAt: new Date().toISOString()
  }
];

const INITIAL_ENGINEER_ASSIGNMENTS: EngineerAssignment[] = [
  {
    id: "eng_assign_1",
    engineerName: "م. عيسى ناجي القادري",
    engineerPhone: "777123456",
    specialty: "استشاري ضبط جودة ورصف الطرق",
    assignedDistricts: ["مديرية ذي السفال", "مديرية جبلة"],
    assignedInitiativeIds: ["init_dhi_as_sufal_1", "init_jiblah_1"],
    approvedDistricts: ["مديرية ذي السفال", "مديرية جبلة"],
    status: "active",
    createdAt: "2026-01-10",
    notes: "مشرف ميداني رئيسي على عقبات ذي السفال وجبلة"
  },
  {
    id: "eng_assign_2",
    engineerName: "م. عادل صالح مقبل",
    engineerPhone: "773456789",
    specialty: "مهندس طرق ومستشفيات ميدانية",
    assignedDistricts: ["مديرية جبلة", "مديرية القفر"],
    assignedInitiativeIds: ["init_jiblah_1"],
    approvedDistricts: ["مديرية جبلة"],
    status: "active",
    createdAt: "2026-02-01",
    notes: "مكلف بمتابعة المبادرات المفتوحة في القفر وجبلة"
  },
  {
    id: "eng_assign_3",
    engineerName: "م. محمد عبدالله الحميري",
    engineerPhone: "771987654",
    specialty: "مهندس مساحة وخرسانات",
    assignedDistricts: ["مديرية السياني", "مديرية يريم"],
    assignedInitiativeIds: [],
    approvedDistricts: ["مديرية السياني"],
    status: "active",
    createdAt: "2026-03-15",
    notes: "متاح للتكليف في مديريات المربع الجنوبي"
  }
];

export default function EngineersReportPortal({ initiatives, onUpdateInitiative, userRole = 'admin', targetInitiativeId }: EngineersReportPortalProps) {
  const [activeTab, setActiveTab] = useState<'smart_evaluation' | 'assignments' | 'archive' | 'submit'>('smart_evaluation');
  
  // Reports State stored locally
  const [reports, setReports] = useState<EngineerSubmissionReport[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cooperative_engineers_submission_reports');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.warn('Failed to parse saved engineer reports', e);
        }
      }
    }
    return SAMPLE_FIELD_REPORTS;
  });

  // Save reports to localStorage safely
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cooperative_engineers_submission_reports', JSON.stringify(reports));
      } catch (e) {
        console.warn('QuotaExceededError when saving engineer reports to localStorage:', e);
        // Strip heavy base64 image placeholders if storage is full
        try {
          const lightweightReports = reports.map(r => ({
            ...r,
            photoUrl: (r.photoUrl && r.photoUrl.length > 50000) ? undefined : r.photoUrl
          }));
          localStorage.setItem('cooperative_engineers_submission_reports', JSON.stringify(lightweightReports));
        } catch (innerErr) {
          console.error('Failed to save lightweight engineer reports:', innerErr);
        }
      }
    }
  }, [reports]);

  // Engineer Assignments State
  const [engineerAssignments, setEngineerAssignments] = useState<EngineerAssignment[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cooperative_engineer_assignments');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.warn('Failed to parse saved engineer assignments', e);
        }
      }
    }
    return INITIAL_ENGINEER_ASSIGNMENTS;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cooperative_engineer_assignments', JSON.stringify(engineerAssignments));
      } catch (e) {
        console.warn('Failed to save engineer assignments to localStorage:', e);
      }
    }
  }, [engineerAssignments]);

  // Modal State for Engineer Assignment
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<EngineerAssignment | null>(null);

  // Assignment Modal Form Fields
  const [modalEngName, setModalEngName] = useState('');
  const [modalEngPhone, setModalEngPhone] = useState('');
  const [modalSpecialty, setModalSpecialty] = useState('');
  const [modalAssignedDistricts, setModalAssignedDistricts] = useState<string[]>([]);
  const [modalAssignedInitiatives, setModalAssignedInitiatives] = useState<string[]>([]);
  const [modalApprovedDistricts, setModalApprovedDistricts] = useState<string[]>([]);
  const [modalStatus, setModalStatus] = useState<'active' | 'suspended'>('active');
  const [modalNotes, setModalNotes] = useState('');


  // Form inputs state
  const [engineerName, setEngineerName] = useState('م. عيسى ناجي القادري');
  const [engineerPhone, setEngineerPhone] = useState('777123456');
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<string>(targetInitiativeId || initiatives[0]?.id || '');

  useEffect(() => {
    if (targetInitiativeId) {
      setSelectedInitiativeId(targetInitiativeId);
      setActiveTab('submit');
    }
  }, [targetInitiativeId]);
  const [pavedMetersToday, setPavedMetersToday] = useState<number>(50);
  const [cementUsedBags, setCementUsedBags] = useState<number>(20);
  const [qualityScore, setQualityScore] = useState<number>(95);
  const [obstacles, setObstacles] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80');
  const [photoBeforeUrl, setPhotoBeforeUrl] = useState('https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80');
  const [photoAfterUrl, setPhotoAfterUrl] = useState('https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80');
  const [selectedImageForModal, setSelectedImageForModal] = useState<{ url: string; title: string; type?: 'before' | 'after'; beforeUrl?: string; afterUrl?: string } | null>(null);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

  // Extract unique districts from initiatives
  const uniqueDistrictsInApp = Array.from(new Set(initiatives.map(i => i.district).filter(Boolean)));
  const availableDistricts = uniqueDistrictsInApp.length > 0 ? uniqueDistrictsInApp : [
    "مديرية ذي السفال", "مديرية جبلة", "مديرية السياني", "مديرية القفر", "مديرية يريم", "مديرية العدين"
  ];

  // Open modal for new assignment
  const handleOpenAddModal = () => {
    setEditingAssignment(null);
    setModalEngName('');
    setModalEngPhone('');
    setModalSpecialty('استشاري إشراف وضبط جودة');
    setModalAssignedDistricts([availableDistricts[0] || 'مديرية ذي السفال']);
    setModalAssignedInitiatives([]);
    setModalApprovedDistricts([availableDistricts[0] || 'مديرية ذي السفال']);
    setModalStatus('active');
    setModalNotes('');
    setIsAssignmentModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (assignment: EngineerAssignment) => {
    setEditingAssignment(assignment);
    setModalEngName(assignment.engineerName);
    setModalEngPhone(assignment.engineerPhone);
    setModalSpecialty(assignment.specialty);
    setModalAssignedDistricts(assignment.assignedDistricts || []);
    setModalAssignedInitiatives(assignment.assignedInitiativeIds || []);
    setModalApprovedDistricts(assignment.approvedDistricts || []);
    setModalStatus(assignment.status);
    setModalNotes(assignment.notes || '');
    setIsAssignmentModalOpen(true);
  };

  // Save assignment
  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEngName.trim()) return;

    if (editingAssignment) {
      const updated = engineerAssignments.map(a => {
        if (a.id === editingAssignment.id) {
          return {
            ...a,
            engineerName: modalEngName,
            engineerPhone: modalEngPhone,
            specialty: modalSpecialty,
            assignedDistricts: modalAssignedDistricts,
            assignedInitiativeIds: modalAssignedInitiatives,
            approvedDistricts: modalApprovedDistricts,
            status: modalStatus,
            notes: modalNotes
          };
        }
        return a;
      });
      setEngineerAssignments(updated);
    } else {
      const newAssignment: EngineerAssignment = {
        id: `eng_assign_${Date.now()}`,
        engineerName: modalEngName,
        engineerPhone: modalEngPhone,
        specialty: modalSpecialty,
        assignedDistricts: modalAssignedDistricts,
        assignedInitiativeIds: modalAssignedInitiatives,
        approvedDistricts: modalApprovedDistricts,
        status: modalStatus,
        createdAt: new Date().toISOString().split('T')[0],
        notes: modalNotes
      };
      setEngineerAssignments([newAssignment, ...engineerAssignments]);
    }

    setIsAssignmentModalOpen(false);
  };

  // Delete assignment
  const handleDeleteAssignment = (id: string) => {
    if (confirm('هل أنت متأكد من إلغاء وتعيين هذا المهندس؟')) {
      setEngineerAssignments(engineerAssignments.filter(a => a.id !== id));
    }
  };

  // Quick toggle approval for district
  const handleToggleDistrictApproval = (assignmentId: string, district: string) => {
    setEngineerAssignments(engineerAssignments.map(a => {
      if (a.id === assignmentId) {
        const hasApproval = a.approvedDistricts.includes(district);
        const newApproved = hasApproval
          ? a.approvedDistricts.filter(d => d !== district)
          : [...a.approvedDistricts, district];
        return {
          ...a,
          approvedDistricts: newApproved
        };
      }
      return a;
    }));
  };

  // Quick action to trigger submission for an engineer & initiative
  const handleStartReportForTask = (engName: string, engPhone: string, initiativeId: string) => {
    setEngineerName(engName);
    setEngineerPhone(engPhone);
    setSelectedInitiativeId(initiativeId);
    setActiveTab('submit');
  };


  // Handle local file upload / camera capture for Before Photo
  const handleBeforePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhotoBeforeUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle local file upload / camera capture for After Photo
  const handleAfterPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhotoAfterUrl(reader.result);
          setPhotoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle general file upload fallback
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhotoUrl(reader.result);
          if (!photoAfterUrl) setPhotoAfterUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Archive Filter
  const [archiveStatusFilter, setArchiveStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected initiative details
  const currentInitiative = initiatives.find(i => i.id === selectedInitiativeId) || initiatives[0];

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInitiative) return;

    const newReport: EngineerSubmissionReport = {
      id: `eng_rep_${Date.now()}`,
      engineerName,
      engineerPhone,
      district: currentInitiative.district,
      subDistrict: currentInitiative.subDistrict,
      village: currentInitiative.village,
      initiativeId: currentInitiative.id,
      initiativeName: currentInitiative.name,
      date: new Date().toISOString().split('T')[0],
      pavedMetersToday: Number(pavedMetersToday),
      cementUsedBags: Number(cementUsedBags),
      qualityScore: Number(qualityScore),
      obstacles,
      notes,
      photoUrl: photoAfterUrl || photoBeforeUrl || photoUrl,
      photoBeforeUrl,
      photoAfterUrl,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    setReports([newReport, ...reports]);
    setSubmitSuccessMsg('تم رفع التقرير الميداني وتوثيق صوّر المسار (قبل وبعد التدخل) بنجاح! تم حفظ التقرير في الأرشيف وهو بانتظار مراجعة وموافقة الإدارة.');
    
    // Reset form fields
    setPavedMetersToday(50);
    setCementUsedBags(20);
    setObstacles('');
    setNotes('');

    setTimeout(() => {
      setSubmitSuccessMsg(null);
      setActiveTab('archive');
    }, 2500);
  };

  // Approval Handler: Approve & Sync directly to App Core Initiative State
  const handleApproveAndSyncToAppCore = (report: EngineerSubmissionReport) => {
    const targetInit = initiatives.find(i => i.id === report.initiativeId);
    if (!targetInit) {
      alert('لم يتم العثور على المبادرة الأصلية المربوطة بهذا التقرير.');
      return;
    }

    // 1. Calculate new progress based on total distance or existing rate
    const currentRate = targetInit.completionRate || 0;
    const totalDistMeters = (targetInit.totalDistance || 0.5) * 1000;
    const addedRate = Math.min(100, Math.round((report.pavedMetersToday / totalDistMeters) * 100));
    const newRate = Math.min(100, currentRate + addedRate);

    // 2. Build new field report object for initiative.reports
    const newFieldReport: FieldReport = {
      id: `field_rep_${Date.now()}`,
      title: `تقرير ميداني معتمد من المهندس: ${report.engineerName}`,
      date: report.date,
      description: `تم رصف ${report.pavedMetersToday} م² واستهلاك ${report.cementUsedBags} كيس إسمنت. الملاحظات: ${report.notes || 'مطابق للمواصفات'}`,
      isMatchedWithDeskReview: true,
      status: 'approved',
      achievements: [
        `رصف مساحة جديدة بقيمة ${report.pavedMetersToday} متر مربع.`,
        `استهلاك ${report.cementUsedBags} كيس إسمنت بمواصفات جودة ${report.qualityScore}%.`,
        ...(report.photoBeforeUrl && report.photoAfterUrl ? ['تم توثيق صوّر المسار قبل وبعد التدخل التنموي بالكاميرا الميدانية.'] : [])
      ],
      challenges: report.obstacles ? [report.obstacles] : ['لا توجد عوائق أمنية أو أهلية مذكورة.']
    };

    // 3. Update initiative object
    const updatedInitiative: Initiative = {
      ...targetInit,
      completionRate: newRate,
      status: newRate >= 100 ? 'completed' : 'ongoing',
      reports: [newFieldReport, ...(targetInit.reports || [])],
      updatedAt: new Date().toISOString()
    };

    // 4. Trigger top-level state update
    onUpdateInitiative(updatedInitiative);

    // 5. Update submission report status
    const updatedReports = reports.map(r => {
      if (r.id === report.id) {
        return {
          ...r,
          status: 'approved' as const,
          approvedAt: new Date().toISOString(),
          approvedBy: 'المشرف التنموي المعتمد'
        };
      }
      return r;
    });

    setReports(updatedReports);
    alert(`✅ تم اعتماد التقرير الميداني بنجاح!\n\nتم تحديث المبادرة (${targetInit.name}):\n• نسبة الإنجاز الجديدة: ${newRate}%\n• دمج البيانات المرفوعة في القوائم الأم والأرقام العامة للمنصة والتطبيق.`);
  };

  const filteredReports = reports.filter(r => {
    const matchesStatus = archiveStatusFilter === 'all' || r.status === archiveStatusFilter;
    const matchesQuery = r.engineerName.includes(searchQuery) || 
                         r.initiativeName.includes(searchQuery) || 
                         r.district.includes(searchQuery);
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn pb-12" dir="rtl">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1.5">
              <HardHat className="w-3.5 h-3.5 text-amber-400" />
              مصدر القرار: محرك القرار التنموي V1 (بوابة المهندسين)
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold px-3 py-1 rounded-full">
              محافظة إب 🇾🇪
            </span>
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold px-3 py-1 rounded-full">
              إدارة التكليفات والصلاحيات 🛡️
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            لوحة المهندسين الميدانيين وتوزيع المهام والمديريات
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            تتيح للمسؤول تعيين المهندسين على المبادرات والمديريات، ومنح موافقات الاطلاع المعتمدة، مع متابعة تفصيلية لحالة رفع التقارير اليومية لكل مبادرة بشكل منفصل.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/90 p-2 rounded-2xl border border-slate-700 shrink-0 flex-wrap">
          <button
            onClick={() => setActiveTab('smart_evaluation')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'smart_evaluation'
                ? 'bg-emerald-400 text-slate-950 font-black shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>بوابة التقييم الميداني الذكية 🧠</span>
          </button>

          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'assignments'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>توزيع المهندسين والمديريات ({engineerAssignments.length}) 🛡️</span>
          </button>

          <button
            onClick={() => setActiveTab('archive')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'archive'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>الأرشيف الميداني ({reports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('submit')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'submit'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>استمارة رفع جديد 📝</span>
          </button>
        </div>
      </div>

      {submitSuccessMsg && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg border border-emerald-500 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-6 h-6 shrink-0" />
          <p className="text-xs sm:text-sm font-bold">{submitSuccessMsg}</p>
        </div>
      )}

      {/* ==================== TAB 0: SMART FIELD ASSESSMENT PORTAL ==================== */}
      {activeTab === 'smart_evaluation' && (
        <SmartFieldAssessmentPortal
          initiatives={initiatives}
          onUpdateInitiative={onUpdateInitiative}
          userRole={userRole}
          targetInitiativeId={targetInitiativeId}
        />
      )}

      {/* ==================== TAB 1: ENGINEER ASSIGNMENTS & TASKS PANEL ==================== */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          {/* Admin Header & Stats Banner */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 uppercase">
                  لوحة تحكم المسؤول 🛡️
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-1">
                  تعيين المهندسين الميدانيين وصلاحيات المديريات والمهام
                </h2>
              </div>

              {userRole === 'admin' && (
                <button
                  onClick={handleOpenAddModal}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl transition-all shadow-md flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>تعيين مهندس جديد / إضافة تكليف ➕</span>
                </button>
              )}
            </div>

            {/* KPI Summary Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <span className="text-slate-500 text-[11px] font-bold block">إجمالي المهندسين</span>
                <strong className="text-xl font-black text-slate-900">{engineerAssignments.length} مهندسين</strong>
              </div>

              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200/80">
                <span className="text-emerald-700 text-[11px] font-bold block">المهندسين النشطين</span>
                <strong className="text-xl font-black text-emerald-900">
                  {engineerAssignments.filter(a => a.status === 'active').length} نشط
                </strong>
              </div>

              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-200/80">
                <span className="text-indigo-700 text-[11px] font-bold block">المديريات المعتمدة</span>
                <strong className="text-xl font-black text-indigo-900">
                  {Array.from(new Set(engineerAssignments.flatMap(a => a.approvedDistricts))).length} مديريات
                </strong>
              </div>

              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200/80">
                <span className="text-amber-800 text-[11px] font-bold block">إجمالي التقارير المرفوعة</span>
                <strong className="text-xl font-black text-amber-950">{reports.length} تقرير</strong>
              </div>
            </div>
          </div>

          {/* Engineers List with Ongoing Tasks Breakdown */}
          <div className="space-y-6">
            {engineerAssignments.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                <Users className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-700">لا يوجد مهندسين معينين حالياً</h3>
                <p className="text-xs text-slate-500">قم بإضافة مهندس جديد وتعيينه على المديريات والمبادرات المطلوبة.</p>
                <button
                  onClick={handleOpenAddModal}
                  className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  تعيين مهندس جديد
                </button>
              </div>
            ) : (
              engineerAssignments.map(eng => {
                // Find all assigned initiatives for this engineer
                const assignedInits = initiatives.filter(init => 
                  eng.assignedInitiativeIds.includes(init.id) ||
                  eng.assignedDistricts.includes(init.district)
                );

                return (
                  <div key={eng.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-slate-300">
                    {/* Engineer Header */}
                    <div className="p-5 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/30 text-amber-300 flex items-center justify-center font-black text-lg shrink-0">
                          <HardHat className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-black text-white">{eng.engineerName}</h3>
                            <span className="text-[10px] bg-slate-800 text-amber-300 border border-slate-700 font-bold px-2.5 py-0.5 rounded-full">
                              {eng.specialty}
                            </span>
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                              eng.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}>
                              {eng.status === 'active' ? 'نشط ميدانياً 🟢' : 'موقوف مؤقتاً 🔴'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-500" /> {eng.engineerPhone}</span>
                            <span>•</span>
                            <span>تاريخ التعيين: {eng.createdAt}</span>
                          </p>
                        </div>
                      </div>

                      {/* Admin Controls */}
                      {userRole === 'admin' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(eng)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <Edit className="w-3.5 h-3.5 text-amber-400" />
                            <span>تعديل الصلاحيات</span>
                          </button>
                          <button
                            onClick={() => handleDeleteAssignment(eng.id)}
                            className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-bold rounded-xl border border-rose-800 flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>إلغاء التعيين</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Districts & Approval Permissions Section */}
                    <div className="p-5 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Assigned Districts */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                          <span>المديريات الموكل إليها الإشراف الميداني:</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {eng.assignedDistricts.length > 0 ? (
                            eng.assignedDistricts.map((d, idx) => (
                              <span key={idx} className="bg-indigo-50 text-indigo-900 border border-indigo-200 text-xs font-bold px-2.5 py-1 rounded-lg">
                                {d}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">لم يتم إسناد مديرية محددة</span>
                          )}
                        </div>
                      </div>

                      {/* Granted Approval Districts Scope for App Access */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>صلاحيات الموافقة والاطلاع المعتمدة بالتطبيق:</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {availableDistricts.map((dist, idx) => {
                            const isApproved = eng.approvedDistricts.includes(dist);
                            return (
                              <button
                                key={idx}
                                onClick={() => userRole === 'admin' && handleToggleDistrictApproval(eng.id, dist)}
                                title={isApproved ? "تم منح الموافقة (اضغط للتغيير)" : "لم تمنح الموافقة بعد (اضغط للمنح)"}
                                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border flex items-center gap-1 transition-all ${
                                  userRole === 'admin' ? 'cursor-pointer hover:scale-105' : 'cursor-default'
                                } ${
                                  isApproved 
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                                    : 'bg-slate-200/80 text-slate-500 border-slate-300 opacity-60'
                                }`}
                              >
                                {isApproved ? <Unlock className="w-3 h-3 text-emerald-700" /> : <Lock className="w-3 h-3 text-slate-400" />}
                                <span>{dist}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Ongoing Tasks & Initiatives Report Status Breakdown */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                          <ListTodo className="w-4 h-4 text-indigo-600" />
                          <span>قائمة المهام الجارية وحالة رفع التقارير لكل مبادرة بشكل منفصل ({assignedInits.length}):</span>
                        </h4>
                        <span className="text-[10px] text-slate-400 font-bold">تأكيد المتابعة اليومية</span>
                      </div>

                      {assignedInits.length === 0 ? (
                        <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-500 font-bold">
                          لا توجد مبادرات موكلة لهذا المهندس حالياً في المديريات المحددة.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-right text-xs">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-500 font-bold text-[11px] bg-slate-50">
                                <th className="p-2.5">المبادرة</th>
                                <th className="p-2.5">المديرية / العزلة</th>
                                <th className="p-2.5 text-center">نسبة الإنجاز</th>
                                <th className="p-2.5 text-center">حالة الرفع والتقارير</th>
                                <th className="p-2.5 text-center">عدد التقارير</th>
                                <th className="p-2.5 text-center">إجراء سريع</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-bold">
                              {assignedInits.map(init => {
                                // Find reports submitted by this engineer for this initiative
                                const engReportsForInit = reports.filter(r => 
                                  r.initiativeId === init.id && 
                                  (r.engineerName === eng.engineerName || r.engineerPhone === eng.engineerPhone)
                                );

                                const latestReport = engReportsForInit[0];

                                return (
                                  <tr key={init.id} className="hover:bg-slate-50/80 transition-all">
                                    {/* Initiative Info */}
                                    <td className="p-2.5">
                                      <span className="text-[10px] text-indigo-600 font-black block">#{init.initiativeNumber}</span>
                                      <span className="text-slate-900 font-black">{init.name}</span>
                                    </td>

                                    {/* Location */}
                                    <td className="p-2.5 text-slate-600">
                                      <span className="block">{init.district}</span>
                                      <span className="text-[10px] text-slate-400 font-normal">{init.subDistrict}</span>
                                    </td>

                                    {/* Completion rate */}
                                    <td className="p-2.5 text-center">
                                      <div className="w-20 mx-auto space-y-0.5">
                                        <div className="flex justify-between text-[10px] font-black text-slate-700">
                                          <span>{init.completionRate}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                          <div 
                                            className="h-full bg-indigo-600 rounded-full" 
                                            style={{ width: `${init.completionRate}%` }}
                                          />
                                        </div>
                                      </div>
                                    </td>

                                    {/* Report Submission Status */}
                                    <td className="p-2.5 text-center">
                                      {latestReport ? (
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                                          latestReport.status === 'approved' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                                          latestReport.status === 'pending' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                                          'bg-rose-50 text-rose-800 border border-rose-200'
                                        }`}>
                                          {latestReport.status === 'approved' ? 'مستلم ومطابق ✅' :
                                           latestReport.status === 'pending' ? 'قيد مراجعة الإدارة ⏳' : 'مرفوض ❌'}
                                          <span className="text-[9px] text-slate-500 font-normal">({latestReport.date})</span>
                                        </span>
                                      ) : init.status === 'completed' ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                          مكتملة 🏁
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                                          ⚠️ بانتظار التقرير الأول
                                        </span>
                                      )}
                                    </td>

                                    {/* Total Reports */}
                                    <td className="p-2.5 text-center text-slate-800">
                                      <span className="px-2 py-0.5 bg-slate-100 rounded-md font-mono text-xs">
                                        {engReportsForInit.length}
                                      </span>
                                    </td>

                                    {/* Fast Actions */}
                                    <td className="p-2.5 text-center">
                                      <div className="flex items-center justify-center gap-1">
                                        <button
                                          onClick={() => handleStartReportForTask(eng.engineerName, eng.engineerPhone, init.id)}
                                          className="px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-lg text-[10px] transition-all cursor-pointer shadow-2xs"
                                          title="فتح استمارة الرفع اليومي لهذه المبادرة نيابة عن المهندس"
                                        >
                                          رفع تقرير 📝
                                        </button>
                                        <button
                                          onClick={() => {
                                            setSearchQuery(eng.engineerName);
                                            setActiveTab('archive');
                                          }}
                                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                                          title="معاينة أرشيف تقارير المهندس"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}


      {/* SUBMIT REPORT FORM */}
      {activeTab === 'submit' && (
        <form onSubmit={handleSubmitReport} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span>استمارة الرفع الميداني اليومي للمهندس الميداني</span>
            </h3>
            <span className="text-xs bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full">
              تحديث البيانات والتغذية الميدانية 👷‍♂️
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-2">اسم المهندس الميداني</label>
              <input
                type="text"
                required
                value={engineerName}
                onChange={(e) => setEngineerName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-2">رقم الهاتف التواصل</label>
              <input
                type="text"
                required
                value={engineerPhone}
                onChange={(e) => setEngineerPhone(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-2">اختر المبادرة الميدانية</label>
              <select
                value={selectedInitiativeId}
                onChange={(e) => setSelectedInitiativeId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                {initiatives.map(init => (
                  <option key={init.id} value={init.id}>
                    {init.name} - ({init.district})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {currentInitiative && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-emerald-950">
              <div>
                <span className="text-slate-500 font-extrabold">الموقع: </span>
                <span>{currentInitiative.district} - {currentInitiative.subDistrict} - {currentInitiative.village}</span>
              </div>
              <div>
                <span className="text-slate-500 font-extrabold">نسبة الإنجاز الحالية: </span>
                <span className="text-emerald-700 font-black">{currentInitiative.completionRate}%</span>
              </div>
            </div>
          )}

          {/* Quantitative Field Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-2">أمتار الرصف المنجزة اليوم (م²)</label>
              <input
                type="number"
                min="1"
                required
                value={isNaN(pavedMetersToday) ? 0 : pavedMetersToday}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setPavedMetersToday(isNaN(val) ? 0 : val);
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-2">كمية الإسمنت المستهلكة (كيس إسمنت)</label>
              <input
                type="number"
                min="1"
                required
                value={isNaN(cementUsedBags) ? 0 : cementUsedBags}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCementUsedBags(isNaN(val) ? 0 : val);
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-2">نسبة المطابقة والجودة الهندسية (%)</label>
              <input
                type="number"
                min="50"
                max="100"
                required
                value={isNaN(qualityScore) ? 0 : qualityScore}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setQualityScore(isNaN(val) ? 0 : val);
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-2">العوائق الميدانية والنزاعات الأهلية (إن وجدت)</label>
            <textarea
              rows={2}
              placeholder="اكتب أي عوائق تتعلق بتضاريس الموقع، الرطوبة، أو النزاعات على حواشي الطريق..."
              value={obstacles}
              onChange={(e) => setObstacles(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-2">ملاحظات المهندس والتوصيات الفنية</label>
            <textarea
              rows={2}
              placeholder="التأكد من فواصل التمدد، نسبة الرش بالماء، وتوفير الكري والأيدي العاملة..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Field Route Photos Section (Before & After Intervention) */}
          <div className="p-5 bg-gradient-to-br from-slate-50 to-emerald-50/30 border border-slate-200 rounded-2xl space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
              <label className="text-xs font-black text-slate-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-700" />
                <span>توثيق حالة الطريق والمسار الميداني (قبل وبعد التدخل التنموي) 📸</span>
              </label>
              <span className="text-[10px] bg-emerald-100 text-emerald-900 font-extrabold px-2.5 py-1 rounded-full border border-emerald-300">
                التقاط الكاميرا M-Gov Field Cam 📱
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* BEFORE INTERVENTION PHOTO BOX */}
              <div className="p-4 bg-white border border-rose-200 rounded-2xl space-y-3 shadow-xs relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-rose-900 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                    1. صورة حالة الطريق (قبل التدخل التنموي)
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">طريق ترابية / عقبة وعرة / سيول</span>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Camera Capture Input */}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleBeforePhotoUpload}
                      className="hidden"
                      id="before-photo-camera"
                    />
                    <label
                      htmlFor="before-photo-camera"
                      className="px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-black text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <Camera className="w-4 h-4" />
                      <span>التقاط بالكاميرا 📷</span>
                    </label>

                    {/* Standard File Picker */}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBeforePhotoUpload}
                      className="hidden"
                      id="before-photo-file"
                    />
                    <label
                      htmlFor="before-photo-file"
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 border border-slate-300"
                    >
                      <ImageIcon className="w-4 h-4 text-slate-600" />
                      <span>اختيار ملف 📁</span>
                    </label>
                  </div>

                  <input
                    type="url"
                    placeholder="رابط الصورة الحالية..."
                    value={photoBeforeUrl}
                    onChange={(e) => setPhotoBeforeUrl(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-rose-600"
                  />

                  {/* Before Presets */}
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">نماذج حالة المسار قبل التدخل:</span>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { name: 'عقبة وعرة ⛰️', url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80' },
                        { name: 'انزلاق وانهيار 🌧️', url: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=800&q=80' },
                        { name: 'طريق ترابية 🚜', url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80' }
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPhotoBeforeUrl(preset.url)}
                          className={`text-[10px] px-2 py-0.5 rounded-lg font-bold border transition-all cursor-pointer ${
                            photoBeforeUrl === preset.url
                              ? 'bg-rose-100 text-rose-900 border-rose-400 font-black'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Before Preview */}
                {photoBeforeUrl && (
                  <div className="relative h-28 w-full rounded-xl overflow-hidden border border-rose-300 bg-slate-900 shadow-inner group">
                    <img
                      src={photoBeforeUrl}
                      alt="حالة الطريق قبل التدخل"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 bg-rose-700/90 backdrop-blur-xs text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs">
                      قبل التدخل 🔴
                    </div>
                  </div>
                )}
              </div>

              {/* AFTER INTERVENTION PHOTO BOX */}
              <div className="p-4 bg-white border border-emerald-200 rounded-2xl space-y-3 shadow-xs relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    2. صورة حالة الطريق (بعد التدخل التنموي)
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">رصف خرساني / جدار ساند / إنجاز</span>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Camera Capture Input */}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleAfterPhotoUpload}
                      className="hidden"
                      id="after-photo-camera"
                    />
                    <label
                      htmlFor="after-photo-camera"
                      className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <Camera className="w-4 h-4" />
                      <span>التقاط بالكاميرا 📷</span>
                    </label>

                    {/* Standard File Picker */}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAfterPhotoUpload}
                      className="hidden"
                      id="after-photo-file"
                    />
                    <label
                      htmlFor="after-photo-file"
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 border border-slate-300"
                    >
                      <ImageIcon className="w-4 h-4 text-slate-600" />
                      <span>اختيار ملف 📁</span>
                    </label>
                  </div>

                  <input
                    type="url"
                    placeholder="رابط الصورة الحالية..."
                    value={photoAfterUrl}
                    onChange={(e) => {
                      setPhotoAfterUrl(e.target.value);
                      setPhotoUrl(e.target.value);
                    }}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-600"
                  />

                  {/* After Presets */}
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">نماذج حالة المسار بعد الإنجاز:</span>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { name: 'رصف خرساني 🛣️', url: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80' },
                        { name: 'جدار وتوسعة 🧱', url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80' },
                        { name: 'عبارة وقنوات 🌊', url: 'https://images.unsplash.com/photo-1517649763962-0c6232662000?auto=format&fit=crop&w=800&q=80' }
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setPhotoAfterUrl(preset.url);
                            setPhotoUrl(preset.url);
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded-lg font-bold border transition-all cursor-pointer ${
                            photoAfterUrl === preset.url
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-black'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live After Preview */}
                {photoAfterUrl && (
                  <div className="relative h-28 w-full rounded-xl overflow-hidden border border-emerald-300 bg-slate-900 shadow-inner group">
                    <img
                      src={photoAfterUrl}
                      alt="حالة الطريق بعد التدخل"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 bg-emerald-700/90 backdrop-blur-xs text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs">
                      بعد التدخل 🟢
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-black px-6 py-3 rounded-2xl text-xs transition-all cursor-pointer flex items-center gap-2 shadow-md"
            >
              <Send className="w-4 h-4" />
              <span>رفع التقرير الميداني للأرشيف 📤</span>
            </button>
          </div>
        </form>
      )}

      {/* ARCHIVE & APPROVAL VIEW */}
      {activeTab === 'archive' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                placeholder="البحث باسم المهندس أو المبادرة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <span className="text-xs font-bold text-slate-500 shrink-0">حالة الاعتماد:</span>
              <button
                onClick={() => setArchiveStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  archiveStatusFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                الكل ({reports.length})
              </button>

              <button
                onClick={() => setArchiveStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  archiveStatusFilter === 'pending'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                قيد المراجعة ⏳ ({reports.filter(r => r.status === 'pending').length})
              </button>

              <button
                onClick={() => setArchiveStatusFilter('approved')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  archiveStatusFilter === 'approved'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                معتمد ومربوط بالقوائم ✅ ({reports.filter(r => r.status === 'approved').length})
              </button>
            </div>
          </div>

          {/* Reports Grid/Cards */}
          <div className="space-y-4">
            {filteredReports.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                <Archive className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-700 text-sm">لا توجد تقارير ميدانية في الأرشيف تطابق الفلتر الحرفي</h3>
              </div>
            ) : (
              filteredReports.map(report => (
                <div key={report.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-slate-900 text-base">{report.initiativeName}</h3>
                        <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
                          {report.district}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-bold mt-1">
                        المهندس الميداني: <span className="text-slate-800">{report.engineerName}</span> ({report.engineerPhone}) | التاريخ: {report.date}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {report.status === 'pending' && (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                          قيد المراجعة ⏳
                        </span>
                      )}

                      {report.status === 'approved' && (
                        <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          معتمد ومربوط بالقوائم الأم ✅
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantitative Data Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-500 block">الرصف المنجز اليوم</span>
                      <span className="text-sm font-black text-slate-900">{report.pavedMetersToday} م²</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-500 block">الإسمنت المستهلك</span>
                      <span className="text-sm font-black text-indigo-700">{report.cementUsedBags} كيس إسمنت</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-500 block">مطابقة الجودة</span>
                      <span className="text-sm font-black text-emerald-700">{report.qualityScore}%</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-500 block">تاريخ المرفوع</span>
                      <span className="text-sm font-bold text-slate-700">{new Date(report.submittedAt).toLocaleDateString('ar-YE')}</span>
                    </div>
                  </div>

                  {report.obstacles && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 font-bold flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="block font-black">العوائق الميدانية:</span>
                        <span>{report.obstacles}</span>
                      </div>
                    </div>
                  )}

                  {report.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="font-extrabold text-slate-800">ملاحظات المهندس: </span>
                      {report.notes}
                    </p>
                  )}

                  {/* Field Route Photos Comparison Card (Before & After) */}
                  {(report.photoBeforeUrl || report.photoAfterUrl || report.photoUrl) && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                          <Camera className="w-4 h-4 text-emerald-600" />
                          توثيق حالة المسار والطريق قبل وبعد التدخل التنموي 📷
                        </span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                          توثيق الكاميرا الميدانية
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* BEFORE PHOTO CARD */}
                        {report.photoBeforeUrl && (
                          <div 
                            onClick={() => setSelectedImageForModal({
                              url: report.photoBeforeUrl!,
                              title: `حالة الطريق قبل التدخل - ${report.initiativeName}`,
                              type: 'before',
                              beforeUrl: report.photoBeforeUrl,
                              afterUrl: report.photoAfterUrl || report.photoUrl
                            })}
                            className="relative h-32 rounded-xl overflow-hidden border border-rose-300 bg-slate-900 cursor-pointer group shadow-xs hover:border-rose-500 transition-all"
                          >
                            <img 
                              src={report.photoBeforeUrl} 
                              alt="قبل التدخل"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80';
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2.5 justify-between">
                              <span className="text-[11px] font-black text-white bg-rose-700 px-2 py-0.5 rounded-md shadow-xs">
                                🔴 قبل التدخل
                              </span>
                              <span className="text-[10px] text-slate-200 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                🔍 تكبير
                              </span>
                            </div>
                          </div>
                        )}

                        {/* AFTER PHOTO CARD */}
                        {(report.photoAfterUrl || report.photoUrl) && (
                          <div 
                            onClick={() => setSelectedImageForModal({
                              url: report.photoAfterUrl || report.photoUrl!,
                              title: `حالة الطريق بعد التدخل - ${report.initiativeName}`,
                              type: 'after',
                              beforeUrl: report.photoBeforeUrl,
                              afterUrl: report.photoAfterUrl || report.photoUrl
                            })}
                            className="relative h-32 rounded-xl overflow-hidden border border-emerald-300 bg-slate-900 cursor-pointer group shadow-xs hover:border-emerald-500 transition-all"
                          >
                            <img 
                              src={report.photoAfterUrl || report.photoUrl} 
                              alt="بعد التدخل"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80';
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2.5 justify-between">
                              <span className="text-[11px] font-black text-white bg-emerald-700 px-2 py-0.5 rounded-md shadow-xs">
                                🟢 بعد التدخل والإنجاز
                              </span>
                              <span className="text-[10px] text-slate-200 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                🔍 تكبير
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions & Sync button for Admin */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="text-[11px] text-slate-400 font-bold">
                      {report.approvedAt && `تم الاعتماد بتاريخ: ${new Date(report.approvedAt).toLocaleDateString('ar-YE')} بواسطة (${report.approvedBy})`}
                    </div>

                    {report.status === 'pending' && userRole === 'admin' && (
                      <button
                        onClick={() => handleApproveAndSyncToAppCore(report)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-black px-4 py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>موافقة واعتمد ربط البيانات بالقوائم الأم للتطبيق ✅</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {selectedImageForModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedImageForModal(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-4 sm:p-6 max-w-5xl w-full space-y-4 shadow-2xl relative max-h-[95vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <h3 className="text-sm sm:text-base font-black text-amber-300 flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                <span>{selectedImageForModal.title || 'المرفق المصور والتوثيق الميداني للمسار'}</span>
              </h3>
              <button
                onClick={() => setSelectedImageForModal(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm transition-all cursor-pointer self-end sm:self-auto"
              >
                ✕
              </button>
            </div>

            {/* If both Before and After exist, show dual comparison display */}
            {selectedImageForModal.beforeUrl && selectedImageForModal.afterUrl ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-xs font-black text-rose-400 block text-center bg-rose-950/60 py-1.5 rounded-xl border border-rose-800">
                      🔴 حالة المسار قبل التدخل التنموي
                    </span>
                    <div className="rounded-2xl overflow-hidden border border-rose-900 bg-slate-950 h-64 sm:h-80 flex items-center justify-center">
                      <img 
                        src={selectedImageForModal.beforeUrl} 
                        alt="قبل التدخل"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-black text-emerald-400 block text-center bg-emerald-950/60 py-1.5 rounded-xl border border-emerald-800">
                      🟢 حالة المسار بعد التدخل والإنجاز
                    </span>
                    <div className="rounded-2xl overflow-hidden border border-emerald-900 bg-slate-950 h-64 sm:h-80 flex items-center justify-center">
                      <img 
                        src={selectedImageForModal.afterUrl} 
                        alt="بعد التدخل"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 max-h-[70vh] flex items-center justify-center">
                <img 
                  src={selectedImageForModal.url} 
                  alt="الصورة التوثيقية الميدانية"
                  className="max-h-[68vh] w-auto object-contain"
                />
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
              <span className="font-bold text-amber-200">
                توثيق هندسي معتمد بكاميرا الموقع M-Gov Field 👷‍♂️
              </span>
              <button
                onClick={() => setSelectedImageForModal(null)}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl cursor-pointer shadow-xs"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Engineer Assignment & Permission Modal Dialog */}
      {isAssignmentModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsAssignmentModalOpen(false)}
        >
          <div 
            className="bg-white border border-slate-200 text-slate-900 rounded-3xl p-6 max-w-2xl w-full space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-1 rounded-full border border-indigo-100 uppercase">
                  صلاحيات التعيين والمديريات 🛡️
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {editingAssignment ? `تعديل تكليف المهندس: ${editingAssignment.engineerName}` : 'تعيين مهندس جديد وإسناد الصلاحيات والمديريات'}
                </h3>
              </div>
              <button
                onClick={() => setIsAssignmentModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 flex items-center justify-center font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم المهندس الثلاثي / اللقب</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: م. أحمد علي قائد"
                    value={modalEngName}
                    onChange={(e) => setModalEngName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم هاتف التواصل</label>
                  <input
                    type="text"
                    required
                    placeholder="77XXXXXXX"
                    value={modalEngPhone}
                    onChange={(e) => setModalEngPhone(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التخصص والصفة الميدانية</label>
                  <input
                    type="text"
                    required
                    placeholder="استشاري إشراف، مهندس طرق، ..."
                    value={modalSpecialty}
                    onChange={(e) => setModalSpecialty(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">حالة التكليف الميداني</label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value as 'active' | 'suspended')}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-600"
                  >
                    <option value="active">نشط ومباشر للعمل 🟢</option>
                    <option value="suspended">موقوف مؤقتاً / مجمد 🔴</option>
                  </select>
                </div>
              </div>

              {/* Assigned Districts Multi-select */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <label className="block text-xs font-black text-slate-800 flex items-center justify-between">
                  <span>المديريات الموكل إليها الإشراف الميداني:</span>
                  <span className="text-[10px] text-indigo-600 font-bold">(اختر واحدة أو أكثر)</span>
                </label>
                <div className="flex flex-wrap gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  {availableDistricts.map((dist, idx) => {
                    const isSelected = modalAssignedDistricts.includes(dist);
                    return (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => {
                          if (isSelected) {
                            setModalAssignedDistricts(modalAssignedDistricts.filter(d => d !== dist));
                          } else {
                            setModalAssignedDistricts([...modalAssignedDistricts, dist]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{dist}</span>
                        {isSelected && <span>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* District Approvals Scope for App Access */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <label className="block text-xs font-black text-slate-800 flex items-center justify-between">
                  <span>المديريات المتاح له موافقة واطلاع عليها بالتطبيق:</span>
                  <span className="text-[10px] text-emerald-700 font-bold">(منح الصلاحيات)</span>
                </label>
                <div className="flex flex-wrap gap-2 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100">
                  {availableDistricts.map((dist, idx) => {
                    const isApproved = modalApprovedDistricts.includes(dist);
                    return (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => {
                          if (isApproved) {
                            setModalApprovedDistricts(modalApprovedDistricts.filter(d => d !== dist));
                          } else {
                            setModalApprovedDistricts([...modalApprovedDistricts, dist]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isApproved
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{dist}</span>
                        {isApproved ? <span>(معتمد ✓)</span> : <span>(محظور)</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Specific Initiatives Selection */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <label className="block text-xs font-black text-slate-800 flex items-center justify-between">
                  <span>تخصيص مبادرات معينة حصرية (اختياري):</span>
                  <span className="text-[10px] text-slate-400 font-bold">في حال تركها فارغة، سيُشرف على كل مبادرات مديرياته</span>
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  {initiatives.map(init => {
                    const isChecked = modalAssignedInitiatives.includes(init.id);
                    return (
                      <label key={init.id} className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer p-1.5 hover:bg-slate-100 rounded-lg">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setModalAssignedInitiatives([...modalAssignedInitiatives, init.id]);
                            } else {
                              setModalAssignedInitiatives(modalAssignedInitiatives.filter(id => id !== init.id));
                            }
                          }}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>#{init.initiativeNumber} - {init.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({init.district})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات والتوجيهات الإدارية</label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات حول التكليف والمتابعة..."
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignmentModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ التعيين والتكليفات الرسمية</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

