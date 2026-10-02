import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  Eye,
  AlertCircle,
  Plus,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Initiative, UserRole, hasPermission } from '../types';
import { areInitiativeNamesMatching } from '../utils/nameNormalizer';
import { parseNum } from '../utils/numberAndDistrictUtils';

export interface StagedSubmission {
  id: string;
  submittedBy: string; // e.g. "فارس التنمية: م. عيسى القادري"
  submittedRole: 'knight' | 'engineer';
  fileName: string;
  fileType: 'excel' | 'pdf' | 'image' | 'csv';
  submittedAt: string;
  status: 'pending_supervisor' | 'approved' | 'rejected';
  
  // Parsed payload
  extractedInitiatives: Partial<Initiative>[];
  detectedConflicts: {
    rowIndex: number;
    extractedName: string;
    existingInitiativeId?: string;
    existingName?: string;
    conflictType: 'duplicate_name' | 'material_discrepancy' | 'new_initiative';
    details: string;
  }[];
  
  fieldNotes?: string;
}

interface FieldWorkspaceStagingPortalProps {
  initiatives: Initiative[];
  onUpdateInitiative: (updated: Initiative) => void;
  onAddInitiative: (newInit: Initiative) => void;
  userRole: UserRole | 'admin' | 'visitor';
}

const INITIAL_STAGED_SUBMISSIONS: StagedSubmission[] = [
  {
    id: "staged_1",
    submittedBy: "فارس الميدان: الأستاذ محمد الحميري (مديرية حبيش)",
    submittedRole: "knight",
    fileName: "مسودة_مبادرة_رصف_عقبة_المنجر_حبيش.xlsx",
    fileType: "excel",
    submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: "pending_supervisor",
    fieldNotes: "تم جمع كشوفات المساهمة الشعبية ومطابقة مسار الطريق مع الأهالي بعزلة صرع.",
    extractedInitiatives: [
      {
        initiativeNumber: "HUB_2026_09",
        name: "مشروع رصف وتوسعة عقبة المنجر - عزلة صرع",
        sector: "الطرق",
        district: "مديرية حبيش",
        subDistrict: "عزلة صرع",
        village: "قرية المنجر",
        cost: 18500000,
        communityContribution: 9500000,
        unitContribution: 9000000,
        completionRate: 25,
        status: "ongoing",
        materialsApproved: "450",
        materialsDisbursed: "200",
        materialsUsed: "120"
      }
    ],
    detectedConflicts: [
      {
        rowIndex: 1,
        extractedName: "مشروع رصف وتوسعة عقبة المنجر - عزلة صرع",
        conflictType: "new_initiative",
        details: "مبادرة جديدة مرفوعة لم تسجل سابقاً بقاعدة البيانات الرئيسية (جاهزة للاعتماد)."
      }
    ]
  },
  {
    id: "staged_2",
    submittedBy: "المهندس الفني: م. عادل مقبل (مديرية جبلة)",
    submittedRole: "engineer",
    fileName: "تقرير_معاينة_عقبة_السايلة_جبلة.pdf",
    fileType: "pdf",
    submittedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: "pending_supervisor",
    fieldNotes: "تم رفع تقرير قياس المساحة المنجزة وملاحظات رصف 85 متراً مربعاً.",
    extractedInitiatives: [
      {
        initiativeNumber: "JIB_2026_01",
        name: "رصف عقبة السايلة - وراف",
        district: "مديرية جبلة",
        subDistrict: "عزلة وراف",
        village: "قرية السايلة",
        completionRate: 65,
        status: "ongoing",
        materialsDisbursed: "350",
        materialsUsed: "280"
      }
    ],
    detectedConflicts: [
      {
        rowIndex: 1,
        extractedName: "رصف عقبة السايلة - وراف",
        existingInitiativeId: "init_jiblah_1",
        existingName: "رصف عقبة السايلة - وراف",
        conflictType: "material_discrepancy",
        details: "مطابقة اسم المبادرة بنجاح. يوجد تحديث على نسبة الإنجاز والأسمنت المستخدم."
      }
    ]
  }
];

export default function FieldWorkspaceStagingPortal({
  initiatives,
  onUpdateInitiative,
  onAddInitiative,
  userRole
}: FieldWorkspaceStagingPortalProps) {
  const [stagedQueue, setStagedQueue] = useState<StagedSubmission[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cooperative_staged_field_submissions');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.warn('Failed to parse staged field submissions', e);
        }
      }
    }
    return INITIAL_STAGED_SUBMISSIONS;
  });

  const [activeTab, setActiveTab] = useState<'upload' | 'pending_queue' | 'history'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [fieldNotesInput, setFieldNotesInput] = useState('');
  const [uploaderRole, setUploaderRole] = useState<'knight' | 'engineer'>('knight');
  const [uploaderName, setUploaderName] = useState('م. عيسى القادري - فارس الميدان');
  
  const [parsedPreview, setParsedPreview] = useState<StagedSubmission | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const saveStagedQueueToStorage = (updated: StagedSubmission[]) => {
    setStagedQueue(updated);
    try {
      localStorage.setItem('cooperative_staged_field_submissions', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save staged submissions', e);
    }
  };

  // Process Excel/CSV File
  const handleFileUpload = (file: File) => {
    setIsProcessing(true);
    setUploadedFileName(file.name);

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv');
    
    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result;
          const workbook = XLSX.read(buffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (!jsonData || jsonData.length < 2) {
            alert('الملف المرفوع فارغ أو لا يحتوي على بيانات كافية.');
            setIsProcessing(false);
            return;
          }

          const headers: string[] = jsonData[0].map((h: any) => String(h || '').trim());
          const rows = jsonData.slice(1);

          const extractedInits: Partial<Initiative>[] = [];
          const conflicts: StagedSubmission['detectedConflicts'] = [];

          rows.forEach((row: any[], idx: number) => {
            if (!row || row.length === 0) return;
            
            const nameVal = String(row[1] || row[0] || '').trim();
            if (!nameVal || nameVal.includes('اسم المبادرة') || nameVal.includes('المسلسل')) return;

            const districtVal = String(row[2] || 'مديرية ذي السفال').trim();
            const subDistrictVal = String(row[3] || '').trim();
            const villageVal = String(row[4] || '').trim();
            const costVal = parseNum(row[5] || 0);
            const commContribVal = parseNum(row[6] || 0);
            const unitContribVal = parseNum(row[7] || 0);
            const completionVal = parseNum(row[8] || 0);

            const newInit: Partial<Initiative> = {
              initiativeNumber: `FIELD_${Date.now()}_${idx + 1}`,
              name: nameVal,
              district: districtVal,
              subDistrict: subDistrictVal,
              village: villageVal,
              cost: costVal,
              communityContribution: commContribVal,
              unitContribution: unitContribVal,
              completionRate: completionVal,
              status: completionVal >= 95 ? 'completed' : 'ongoing',
              materialsDisbursed: String(row[9] || '0'),
              materialsUsed: String(row[10] || '0'),
              createdAt: new Date().toISOString()
            };

            extractedInits.push(newInit);

            // Match against database using name normalizer
            const matchedExisting = initiatives.find(existing => 
              areInitiativeNamesMatching(existing.name, nameVal)
            );

            if (matchedExisting) {
              conflicts.push({
                rowIndex: idx + 1,
                extractedName: nameVal,
                existingInitiativeId: matchedExisting.id,
                existingName: matchedExisting.name,
                conflictType: 'duplicate_name',
                details: `⚠️ تعارض/تطابق اسم: المبادرة موجودة مسبقاً بقاعدة البيانات [${matchedExisting.district}]. سيتم إعداد محضر تحديث وتحديث بيانات الكميات.`
              });
            } else {
              conflicts.push({
                rowIndex: idx + 1,
                extractedName: nameVal,
                conflictType: 'new_initiative',
                details: '✨ مبادرة تنموية جديدة: لا توجد تعارضات، جاهزة للاعتماد والإضافة إلى السجل الموحد.'
              });
            }
          });

          const newStaged: StagedSubmission = {
            id: `staged_${Date.now()}`,
            submittedBy: uploaderName,
            submittedRole: uploaderRole,
            fileName: file.name,
            fileType: file.name.endsWith('.csv') ? 'csv' : 'excel',
            submittedAt: new Date().toISOString(),
            status: 'pending_supervisor',
            fieldNotes: fieldNotesInput || 'تم رفع كشف المبادرات الميداني كمسودة للعرض على المشرف.',
            extractedInitiatives: extractedInits,
            detectedConflicts: conflicts
          };

          setParsedPreview(newStaged);
          setIsProcessing(false);
        } catch (err) {
          console.error('Error parsing file', err);
          alert('حدث خطأ أثناء قراءة البيانات من الملف. يرجى التأكد من تنسيق Excel/CSV.');
          setIsProcessing(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // PDF or Image report upload handling
      const newStaged: StagedSubmission = {
        id: `staged_${Date.now()}`,
        submittedBy: uploaderName,
        submittedRole: uploaderRole,
        fileName: file.name,
        fileType: file.name.endsWith('.pdf') ? 'pdf' : 'image',
        submittedAt: new Date().toISOString(),
        status: 'pending_supervisor',
        fieldNotes: fieldNotesInput || 'تقرير ميداني مرفق للعرض والمطابقة.',
        extractedInitiatives: [
          {
            name: `تقرير ميداني مصور: ${file.name}`,
            district: "مديرية ذي السفال",
            status: "ongoing",
            createdAt: new Date().toISOString()
          }
        ],
        detectedConflicts: [
          {
            rowIndex: 1,
            extractedName: file.name,
            conflictType: "new_initiative",
            details: "مرفق ميداني بحاجة لمعاينة ومطابقة المشرف."
          }
        ]
      };
      setParsedPreview(newStaged);
      setIsProcessing(false);
    }
  };

  const handleConfirmSubmitToSupervisor = () => {
    if (!parsedPreview) return;
    const updated = [parsedPreview, ...stagedQueue];
    saveStagedQueueToStorage(updated);
    setParsedPreview(null);
    setUploadedFileName(null);
    setFieldNotesInput('');
    setSuccessToast('تم إرسال المسودة بنجاح إلى قائمة مراجعة واعتماد المشرف!');
    setActiveTab('pending_queue');
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Supervisor Approval Action (اعتماد وإدماج بـ قاعدة البيانات)
  const handleSupervisorApprove = (submission: StagedSubmission) => {
    if (!hasPermission(userRole, 'canApproveInitiative') && !hasPermission(userRole, 'canClassifyStatus')) {
      alert('عذراً، تحتاج صلاحية المشرف القيادي أو رئيس وحدة التدخلات لاعتماد المسودات وإدماجها بقاعدة البيانات.');
      return;
    }

    // Integrate into main database
    submission.extractedInitiatives.forEach((extInit) => {
      const existing = initiatives.find(i => areInitiativeNamesMatching(i.name, extInit.name || ''));
      if (existing) {
        // Update existing initiative
        const updated: Initiative = {
          ...existing,
          completionRate: extInit.completionRate !== undefined ? extInit.completionRate : existing.completionRate,
          materialsDisbursed: extInit.materialsDisbursed || existing.materialsDisbursed,
          materialsUsed: extInit.materialsUsed || existing.materialsUsed,
          updatedAt: new Date().toISOString()
        };
        onUpdateInitiative(updated);
      } else {
        // Add new initiative
        const newRecord: Initiative = {
          id: `init_${Date.now()}_${String(Date.now()).slice(-4)}`,
          initiativeNumber: extInit.initiativeNumber || `INIT_${Date.now()}`,
          name: extInit.name || 'مبادرة جديدة مرفوعة من الميدان',
          sector: extInit.sector || 'الطرق',
          district: extInit.district || 'مديرية ذي السفال',
          subDistrict: extInit.subDistrict || 'غير محدد',
          village: extInit.village || 'غير محدد',
          coordinates: 'N/E',
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          cost: extInit.cost || 10000000,
          communityContribution: extInit.communityContribution || 5000000,
          unitContribution: extInit.unitContribution || 5000000,
          completionRate: extInit.completionRate || 0,
          status: extInit.status || 'ongoing',
          ownerConfirmed: true,
          governorate: 'إب',
          pathways: [],
          contributions: [],
          materials: [],
          committee: [],
          reports: [],
          createdAt: new Date().toISOString()
        };
        onAddInitiative(newRecord);
      }
    });

    // Mark status as approved
    const updatedQueue = stagedQueue.map(s => 
      s.id === submission.id ? { ...s, status: 'approved' as const } : s
    );
    saveStagedQueueToStorage(updatedQueue);
    setSuccessToast(`تم اعتماد المسودة [${submission.fileName}] وإدماج المبادرات بنجاح في قاعدة البيانات الرئيسية!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleSupervisorReject = (id: string) => {
    const updatedQueue = stagedQueue.map(s => 
      s.id === id ? { ...s, status: 'rejected' as const } : s
    );
    saveStagedQueueToStorage(updatedQueue);
  };

  const pendingSubmissions = stagedQueue.filter(s => s.status === 'pending_supervisor');
  const processedSubmissions = stagedQueue.filter(s => s.status !== 'pending_supervisor');

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Upload className="w-6 h-6" />
            </span>
            <h2 className="text-xl font-black text-white">نظام الميدان المباشر والمراجعة الرفيعة (Staging Field Workspace)</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            منظومة رفع وتحليل ملفات الميدان (Excel / CSV / PDF / صور) وكشف التعارضات وإرسالها إلى المشرف للمراجعة قبل دمجها بقاعدة البيانات.
          </p>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700">
          <Clock className="w-5 h-5 text-amber-400" />
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-semibold">مسودات قيد مراجعة المشرف:</span>
            <span className="text-sm font-black text-amber-400">{pendingSubmissions.length} مسودة</span>
          </div>
        </div>
      </div>

      {successToast && (
        <div className="p-4 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Primary Sub-Tabs Navigation */}
      <div className="flex items-center bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs gap-2">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>رفع وتحليل ملف ميداني جديد</span>
        </button>

        <button
          onClick={() => setActiveTab('pending_queue')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 relative cursor-pointer ${
            activeTab === 'pending_queue'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>قائمة مسودات العتماد ({pendingSubmissions.length})</span>
          {pendingSubmissions.length > 0 && (
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping absolute top-2 left-2" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'history'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>سجل المسودات المعتمدة والسابقة ({processedSubmissions.length})</span>
        </button>
      </div>

      {/* TAB 1: FILE UPLOAD & ANALYZER */}
      {activeTab === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form and Dropzone */}
          <div className="lg:col-span-2 space-y-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>بيانات مرفق الملف الميداني</span>
            </h3>

            {/* Uploader Meta inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الصفة الميدانية لرافع الملف:</label>
                <select
                  value={uploaderRole}
                  onChange={(e) => setUploaderRole(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  <option value="knight">🛡️ فارس التنمية واللجنة المجتمعية</option>
                  <option value="engineer">👷 المهندس الفني والاستشاري</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم رافع التقرير والتواصل:</label>
                <input
                  type="text"
                  value={uploaderName}
                  onChange={(e) => setUploaderName(e.target.value)}
                  placeholder="الاسم الثلاثي ورقم الهاتف..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات وإيضاحات ميدانية للمشرف:</label>
              <textarea
                value={fieldNotesInput}
                onChange={(e) => setFieldNotesInput(e.target.value)}
                placeholder="أضف تفاصيل النزول الميداني والملاحظات الخاصة بتوثيق المسار والمساهمات..."
                rows={2}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Drag Drop Dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                dragActive
                  ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
                  : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50'
              }`}
            >
              <input
                type="file"
                id="field-file-input"
                accept=".xlsx,.xls,.csv,.pdf,image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <label htmlFor="field-file-input" className="cursor-pointer space-y-3 block">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                  {isProcessing ? (
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-8 h-8" />
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-800">
                    {uploadedFileName ? `الملف المحدد: ${uploadedFileName}` : 'اضغط هنا لاختيار ملف أو اسحبه إلى هنا'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    يدعم شيتات Excel (.xlsx, .xls, .csv)، التقرير الهندسي PDF، والصور الميدانية
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Guidelines & Information */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>قواعد الفرز الميداني الآلي</span>
            </h3>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1">
                <span className="font-bold text-amber-300 block">1. التحليل ومطابقة الأسماء:</span>
                <p>يقوم النظام آلياً بتطبيق محرك التطابق اللفظي لتفادي تكرار المبادرات وتحديد المبادرات المسجلة مسبقاً.</p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1">
                <span className="font-bold text-sky-300 block">2. حماية قاعدة البيانات الرئيسية:</span>
                <p>لا يتم إدخال أو التعديل المباشر على قاعدة البيانات إلا بعد مرور الملف بمسودة مراجعة المشرف واعتماده رسمياً.</p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1">
                <span className="font-bold text-emerald-300 block">3. كشف فارق الكميات والمواد:</span>
                <p>يتم مقارنة الأسمنت المستهلك المنصرف بالميدان وتنبيه المشرف بأي فروقات كميات بين الشيت والدراسة.</p>
              </div>
            </div>
          </div>

          {/* PARSED PREVIEW MODAL / PANEL */}
          {parsedPreview && (
            <div className="lg:col-span-3 bg-emerald-950/20 border-2 border-emerald-500/40 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap border-b border-emerald-500/30 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  <div>
                    <h4 className="font-bold text-base text-slate-900">نتائج الفرز الآلي للملف: {parsedPreview.fileName}</h4>
                    <span className="text-xs text-slate-500">تم استخراج {parsedPreview.extractedInitiatives.length} مبادرة/تقرير</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmSubmitToSupervisor}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Clock className="w-4 h-4" />
                    <span>إرسال المسودة لقائمة مراجعة المشرف</span>
                  </button>
                </div>
              </div>

              {/* Extraction Preview Table */}
              <div className="space-y-3">
                <h5 className="font-bold text-xs text-slate-700">المبادرات والمشكلات المكتشفة:</h5>
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">اسم المبادرة الميداني</th>
                        <th className="p-3">المديرية / العزلة</th>
                        <th className="p-3">نسبة الإنجاز</th>
                        <th className="p-3">النتيجة والمطابقة الآلية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                      {parsedPreview.extractedInitiatives.map((init, idx) => {
                        const conflict = parsedPreview.detectedConflicts.find(c => c.rowIndex === idx + 1);
                        return (
                          <tr key={idx} className="hover:bg-slate-50/80">
                            <td className="p-3 text-slate-400">{idx + 1}</td>
                            <td className="p-3 font-bold text-slate-900">{init.name}</td>
                            <td className="p-3 text-slate-600">{init.district} - {init.subDistrict}</td>
                            <td className="p-3 text-emerald-700 font-bold">{init.completionRate}%</td>
                            <td className="p-3">
                              <span className={`p-2 rounded-lg text-[11px] block ${
                                conflict?.conflictType === 'duplicate_name'
                                  ? 'bg-amber-50 text-amber-900 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                              }`}>
                                {conflict?.details}
                              </span>
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
      )}

      {/* TAB 2: PENDING SUPERVISOR REVIEW QUEUE */}
      {activeTab === 'pending_queue' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>المسودات المرفوعة الميدانية المنتظرة لاعتماد المشرف ({pendingSubmissions.length})</span>
            </h3>

            {hasPermission(userRole, 'canApproveInitiative') ? (
              <span className="text-xs bg-emerald-100 text-emerald-900 font-bold px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                لديك صلاحيات اعتماد المباشر
              </span>
            ) : (
              <span className="text-xs bg-amber-100 text-amber-900 font-bold px-3 py-1 rounded-full border border-amber-200">
                وضع العرض (يتطلب حساب المشرف للبدء بالاعتماد)
              </span>
            )}
          </div>

          {pendingSubmissions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="font-bold text-base text-slate-800">جميع المسودات مراجعة ومعتمدة!</h4>
              <p className="text-xs text-slate-500">لا توجد مسودات ميدانية معلقة حالياً تنتظر موافقة المشرف.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingSubmissions.map((sub) => (
                <div key={sub.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap border-b border-slate-100 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{sub.fileName}</span>
                        <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                          قيد المراجعة
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        مرفوع بواسطة: <span className="font-bold text-slate-700">{sub.submittedBy}</span> • التاريخ: {new Date(sub.submittedAt).toLocaleString('ar-YE')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasPermission(userRole, 'canApproveInitiative') && (
                        <>
                          <button
                            onClick={() => handleSupervisorApprove(sub)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            <span>اعتماد وإدماج في قاعدة البيانات الرئيسية</span>
                          </button>

                          <button
                            onClick={() => handleSupervisorReject(sub.id)}
                            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                            <span>رفض</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {sub.fieldNotes && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
                      <span className="font-bold text-slate-900 block mb-0.5">💡 ملاحظات التقرير الميداني:</span>
                      {sub.fieldNotes}
                    </div>
                  )}

                  {/* Extracted Items */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">المبادرات والتحليلات المرفقة:</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {sub.extractedInitiatives.map((init, i) => (
                        <div key={i} className="p-3 bg-emerald-50/50 border border-emerald-200/60 rounded-xl space-y-1 text-xs">
                          <span className="font-bold text-slate-900 block">{init.name}</span>
                          <span className="text-slate-600 block">{init.district} - نسبة الإنجاز: {init.completionRate}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: APPROVED & PREVIOUS SUBMISSIONS */}
      {activeTab === 'history' && (
        <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>سجل المسودات التي تم اعتمادها ودمجها بالسجل الموحد</span>
          </h3>

          {processedSubmissions.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">لا توجد مسودات سابقة معتمدة حتى الآن.</p>
          ) : (
            <div className="space-y-3">
              {processedSubmissions.map((s) => (
                <div key={s.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">{s.fileName}</span>
                    <span className="text-[11px] text-slate-500">مرفوع من: {s.submittedBy}</span>
                  </div>

                  <div>
                    {s.status === 'approved' ? (
                      <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                        ✅ تم الاعتماد والإدماج
                      </span>
                    ) : (
                      <span className="text-xs font-bold bg-rose-100 text-rose-800 px-3 py-1 rounded-full border border-rose-200">
                        ❌ مرفوض
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
