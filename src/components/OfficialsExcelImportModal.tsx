import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  Shield,
  Layers,
  HelpCircle,
  Download,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import {
  OfficialProfile,
  ResponsibleImportValidator,
  ImportValidationReport,
  saveStoredOfficials,
  saveImportLog,
  OfficialImportHistoryLog,
  INITIAL_OFFICIALS
} from '../data/officialsRegistry';

interface OfficialsExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOfficials: OfficialProfile[];
  onImportCompleted: (updatedOfficials: OfficialProfile[], summaryMsg: string) => void;
}

export default function OfficialsExcelImportModal({
  isOpen,
  onClose,
  currentOfficials,
  onImportCompleted
}: OfficialsExcelImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [columnHeaders, setColumnHeaders] = useState<string[]>([]);
  const [validationReport, setValidationReport] = useState<ImportValidationReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Import Strategy:
  // 'replace_all' -> استبدال الشيت المستورد بكل الأسماء السابقة
  // 'add_and_update' -> إضافة الجدد وتحديث الموجودين
  // 'add_only' -> إضافة السجلات الجديدة فقط
  const [importStrategy, setImportStrategy] = useState<'replace_all' | 'add_and_update' | 'add_only'>('replace_all');

  // Column Mappings
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    fullName: 'الاسم الكامل',
    phone: 'رقم الهاتف',
    scope: 'منطقة ونطاق الصلاحيات',
    district: 'المديرية',
    jobTitle: 'المسمى الوظيفي',
    organization: 'الجهة التابع لها',
    permissionLevel: 'مستوى الصلاحية',
    role: 'الدور المؤسسي',
    accountStatus: 'حالة الحساب',
    email: 'البريد الإلكتروني',
    governorate: 'المحافظة',
    assignedInitiativeIds: 'المبادرات المسندة',
    notes: 'ملاحظات'
  });

  // Progress Simulation State
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressStage, setProgressStage] = useState<string>('');

  if (!isOpen) return null;

  // Process rows with auto detection
  const processRawRows = (rows: any[], fName: string) => {
    if (!rows || rows.length === 0) {
      setErrorMessage('الملف لا يحتوي على صفوف بيانات صالحة.');
      setParsedRows([]);
      setValidationReport(null);
      return;
    }

    const headers = Object.keys(rows[0]).filter(k => k && !k.startsWith('__EMPTY'));
    setColumnHeaders(headers);
    setParsedRows(rows);

    // Auto match Arabic column names
    const mapping: Record<string, string> = { ...columnMapping };
    headers.forEach(h => {
      const fieldKey = ResponsibleImportValidator.getArabicFieldKey(h);
      if (fieldKey && mapping[fieldKey] !== undefined) {
        mapping[fieldKey] = h;
      }
    });
    setColumnMapping(mapping);

    // Generate validation report
    const report = ResponsibleImportValidator.validateImportData(rows, currentOfficials, mapping);
    setValidationReport(report);
    setErrorMessage(null);
  };

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          processRawRows(rows, file.name);
        } catch (err: any) {
          setErrorMessage(`تعذر قراءة ملف الإكسل: ${err.message || err}`);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
          if (lines.length === 0) {
            setErrorMessage('الملف فارغ.');
            return;
          }
          const delimiter = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';
          const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
          const rows: any[] = [];
          for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(delimiter).map(p => p.trim().replace(/^["']|["']$/g, ''));
            const obj: any = {};
            headers.forEach((h, idx) => {
              obj[h] = parts[idx] || '';
            });
            rows.push(obj);
          }
          processRawRows(rows, file.name);
        } catch (err: any) {
          setErrorMessage(`تعذر قراءة الملف: ${err.message || err}`);
        }
      };
      reader.readAsText(file);
    }
  };

  // Re-run validation upon mapping change
  const handleRevalidate = () => {
    if (parsedRows.length === 0) return;
    const report = ResponsibleImportValidator.validateImportData(parsedRows, currentOfficials, columnMapping);
    setValidationReport(report);
  };

  // Execute Import with Step-by-Step Progress
  const handleExecuteImport = () => {
    if (!validationReport) return;

    const validOfficials = [...validationReport.newOfficials, ...validationReport.updatedOfficials];
    if (validOfficials.length === 0) {
      setErrorMessage('لا توجد أي سجلات مطابقة وصالحة للاستيراد.');
      return;
    }

    if (importStrategy === 'replace_all') {
      const confirmed = window.confirm(
        `⚠️ تنبيه هام: سيتم استبدال سجل المسؤولين الحالي بالكامل (${currentOfficials.length} مسؤول) بشيت الإكسل المستورد الجديد (${validOfficials.length} مسؤول).\n\nهل أنت متأكد من رغبتك في الاستبدال الكامل؟`
      );
      if (!confirmed) return;
    }

    setIsProcessing(true);
    setProgressPercent(10);
    setProgressStage('جاري قراءة وتجهيز سجلات الشيت...');

    // Progress timer
    setTimeout(() => {
      setProgressPercent(35);
      setProgressStage('جاري فحص وتدقيق أرقام الهواتف ونطاقات الصلاحيات...');

      setTimeout(() => {
        setProgressPercent(65);
        setProgressStage(
          importStrategy === 'replace_all'
            ? 'جاري تفريغ السجلات السابقة وتثبيت الشيت المستورد الجديد كلياً...'
            : 'جاري دمج وتحديث السجلات المؤسسية...'
        );

        setTimeout(() => {
          setProgressPercent(90);
          setProgressStage('جاري حفظ البيانات بالسجل المعتمد وتوليد تقرير التدقيق...');

          setTimeout(() => {
            let finalOfficials: OfficialProfile[] = [];

            if (importStrategy === 'replace_all') {
              // Replace all with imported valid records
              // Preserve the main super admins if not present to prevent lockouts
              const superAdmins = currentOfficials.filter(o => o.id === 'off_admin_001' || o.id === 'off_admin_002');
              const hasSuperAdminInImport = validOfficials.some(o => o.id === 'off_admin_001' || o.phone === '777252525');
              
              if (!hasSuperAdminInImport && superAdmins.length > 0) {
                finalOfficials = [...superAdmins, ...validOfficials];
              } else {
                finalOfficials = [...validOfficials];
              }
            } else if (importStrategy === 'add_and_update') {
              let list = [...currentOfficials];
              if (validationReport.newOfficials.length > 0) {
                list = [...validationReport.newOfficials, ...list];
              }
              if (validationReport.updatedOfficials.length > 0) {
                const updateMap = new Map(validationReport.updatedOfficials.map(o => [o.id, o]));
                list = list.map(o => updateMap.get(o.id) || o);
              }
              finalOfficials = list;
            } else {
              // Add only
              finalOfficials = [...validationReport.newOfficials, ...currentOfficials];
            }

            // Save to storage
            saveStoredOfficials(finalOfficials);

            // Create log
            const log: OfficialImportHistoryLog = {
              id: `log_${Date.now()}`,
              timestamp: new Date().toISOString(),
              importedBy: 'م. عيسى ناجي القادري (مدير النظام)',
              fileName: fileName || 'شيت_المسؤولين_المستورد.xlsx',
              totalRows: validationReport.totalRows,
              addedCount: importStrategy === 'replace_all' ? validOfficials.length : validationReport.newOfficials.length,
              updatedCount: importStrategy === 'add_and_update' ? validationReport.updatedOfficials.length : 0,
              rejectedCount: validationReport.rejectedRows.length,
              rejectionReasons: validationReport.rejectionSummary,
              dataVersion: importStrategy === 'replace_all' ? 'v2.0-REPLACED-ALL' : 'v1.1-SSoT'
            };
            saveImportLog(log);

            setProgressPercent(100);
            setProgressStage('تم إكمال الاستيراد وتحديث قاعدة البيانات بنجاح 100%');
            setIsProcessing(false);

            const summary =
              importStrategy === 'replace_all'
                ? `تم استبدال كافة الأسماء السابقة وتثبيت ${finalOfficials.length} مسؤول من الشيت المستورد بنجاح.`
                : `تم استيراد ${validationReport.newOfficials.length} مسؤول جديد وتحديث ${importStrategy === 'add_and_update' ? validationReport.updatedOfficials.length : 0} سجل بنجاح.`;

            setSuccessMessage(summary);
            onImportCompleted(finalOfficials, summary);

            setTimeout(() => {
              onClose();
            }, 1800);
          }, 400);
        }, 500);
      }, 500);
    }, 400);
  };

  // Download Sample Excel
  const handleDownloadSampleExcel = () => {
    const sampleData = [
      {
        'الاسم الكامل': 'أ. محمد حميد الشامي',
        'رقم الهاتف': '777009009',
        'منطقة ونطاق الصلاحيات': 'نطاق مديرية ذي السفال (عزل: ريمان، حبير، وادي ضباء، الصفة، بني عبداله)',
        'المديرية': 'مديرية ذي السفال',
        'المسمى الوظيفي': 'مدير عام المديرية - رئيس المجلس المحلي',
        'الجهة التابع لها': 'السلطة المحلية بمديرية ذي السفال',
        'مستوى الصلاحية': 'تنفيذي',
        'الدور المؤسسي': 'مدير عام المديرية',
        'حالة الحساب': 'نشط وموثق',
        'البريد الإلكتروني': 'dhisufal_mgr@ebb.gov.ye',
        'المحافظة': 'محافظة إب',
        'المبادرات المسندة': '726, 728',
        'ملاحظات': 'المسؤول التنفيذي المباشر لاعتماد المبادرات'
      },
      {
        'الاسم الكامل': 'م. صادق عبدالله الرداعي',
        'رقم الهاتف': '777011011',
        'منطقة ونطاق الصلاحيات': 'الإشراف الهندسي الميداني ومطابقة كميات الرصف بذي السفال',
        'المديرية': 'مديرية ذي السفال',
        'المسمى الوظيفي': 'مهندس الإشراف الفني الميداني وفرسان التنمية',
        'الجهة التابع لها': 'فريق فرسان الهندسة - وحدة التدخلات',
        'مستوى الصلاحية': 'ميداني',
        'الدور المؤسسي': 'مهندس ميداني ومفتش',
        'حالة الحساب': 'نشط وموثق',
        'البريد الإلكتروني': 'eng_dhisufal@ebb.gov.ye',
        'المحافظة': 'محافظة إب',
        'المبادرات المسندة': '726, 728',
        'ملاحظات': 'مسؤول الرفع الهندسي وفحص نسب الإنجاز'
      },
      {
        'الاسم الكامل': 'الحاج منصور أحمد الجبلي',
        'رقم الهاتف': '777010010',
        'منطقة ونطاق الصلاحيات': 'حشد المشاركة المجتمعية وإسناد اللجان الميدانية بكافة عزل ذي السفال',
        'المديرية': 'مديرية ذي السفال',
        'المسمى الوظيفي': 'رئيس الجمعية التعاونية التنموية بذي السفال',
        'الجهة التابع لها': 'الجمعية التعاونية التنموية متعددة الأغراض',
        'مستوى الصلاحية': 'ميداني',
        'الدور المؤسسي': 'رئيس الجمعية التعاونية',
        'حالة الحساب': 'نشط وموثق',
        'البريد الإلكتروني': 'coop_dhisufal@ebb.gov.ye',
        'المحافظة': 'محافظة إب',
        'المبادرات المسندة': '726, 728',
        'ملاحظات': 'تنسيق المساهمات المجتمعية'
      },
      {
        'الاسم الكامل': 'أ. سلطان الشاجع',
        'رقم الهاتف': '777020020',
        'منطقة ونطاق الصلاحيات': 'نطاق مديرية جبلة (عزل: جبلة، وراف، الربادي، الثوابي، الشهلي)',
        'المديرية': 'مديرية جبلة',
        'المسمى الوظيفي': 'مدير عام مديرية جبلة',
        'الجهة التابع لها': 'السلطة المحلية بمديرية جبلة',
        'مستوى الصلاحية': 'تنفيذي',
        'الدور المؤسسي': 'مدير عام المديرية',
        'حالة الحساب': 'نشط وموثق',
        'البريد الإلكتروني': 'jiblah_dir@ebb.gov.ye',
        'المحافظة': 'محافظة إب',
        'المبادرات المسندة': '',
        'ملاحظات': ''
      },
      {
        'الاسم الكامل': 'م. عادل علي الشجاع',
        'رقم الهاتف': '777021021',
        'منطقة ونطاق الصلاحيات': 'الإشراف الهندسي على عقاب وطرق وراف والربادي والمبادرات الحجرية بجبلة',
        'المديرية': 'مديرية جبلة',
        'المسمى الوظيفي': 'مهندس الإشراف الفني ومسؤول الرصف بجبلة',
        'الجهة التابع لها': 'فرع وحدة التدخلات - قطاع جبلة',
        'مستوى الصلاحية': 'ميداني',
        'الدور المؤسسي': 'مهندس قطاع',
        'حالة الحساب': 'نشط وموثق',
        'البريد الإلكتروني': 'eng_jiblah@ebb.gov.ye',
        'المحافظة': 'محافظة إب',
        'المبادرات المسندة': '',
        'ملاحظات': ''
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws['!cols'] = [
      { wch: 25 },
      { wch: 15 },
      { wch: 45 },
      { wch: 18 },
      { wch: 30 },
      { wch: 30 },
      { wch: 16 },
      { wch: 20 },
      { wch: 16 },
      { wch: 25 },
      { wch: 14 },
      { wch: 20 },
      { wch: 35 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'شيت_المسؤولين_المعتمد');
    XLSX.writeFile(wb, `قالب_استيراد_شيت_المسؤولين_المعتمد_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const totalValid = validationReport ? validationReport.newOfficials.length + validationReport.updatedOfficials.length : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-indigo-950 text-white p-6 flex items-center justify-between shrink-0 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-2xl">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/40">
                  استيراد شامل للإكسل
                </span>
                <span className="text-xs text-slate-300">السجل الحالي: {currentOfficials.length} مسؤول</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                استيراد شيت إكسل بأسماء وأرقام هواتف وصلاحيات المسؤولين والحسابات
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Top Actions & Download Template */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-600 leading-relaxed">
              يدعم استيراد كافة صيغ الإكسل (<strong className="text-slate-900 font-bold">.xlsx, .xls, .csv</strong>) مع التعرف التلقائي الذكي على أسماء الأعمدة العربية والمطابقة الفورية لأرقام الهواتف ومناطق الصلاحيات والحسابات.
            </div>
            <button
              onClick={handleDownloadSampleExcel}
              type="button"
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shrink-0 shadow-sm transition"
            >
              <Download className="w-4 h-4" />
              <span>تحميل نموذج إكسل معتمد (.xlsx)</span>
            </button>
          </div>

          {/* File Picker Section */}
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv,.tsv"
              onChange={handleFileChange}
              className="hidden"
            />

            <div
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center ${
                fileName
                  ? 'border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/70'
                  : 'border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/20'
              }`}
            >
              <Upload className={`w-10 h-10 mb-2 ${fileName ? 'text-emerald-600' : 'text-slate-400'}`} />
              <div className="text-sm font-bold text-slate-800">
                {fileName ? `الملف المحدد: ${fileName}` : 'انقر هنا لاختيار ورفع ملف شيت الإكسل (.xlsx / .xls)'}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {fileName ? 'انقر لتغيير الملف المختار' : 'أو اسحب وأفلت الملف مباشرة'}
              </div>
            </div>
          </div>

          {/* Error / Success Messages */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Import Strategy Options (Replace all vs Add/Update) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>خيارات وخطة معالجة البيانات المستوردة:</span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                حدد الإجراء المطلوب
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {/* Option 1: Replace All */}
              <label
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  importStrategy === 'replace_all'
                    ? 'border-amber-500 bg-amber-50/50 shadow-sm'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    name="importStrategy"
                    checked={importStrategy === 'replace_all'}
                    onChange={() => setImportStrategy('replace_all')}
                    className="mt-1 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      <span>استبدال الشيت بكل الأسماء السابقة</span>
                      <span className="px-1.5 py-0.2 bg-amber-200 text-amber-900 text-[10px] font-extrabold rounded">
                        استبدال كامل
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      حذف السجلات السابقة وتثبيت الشيت المستورد بالكامل ليكون هو المصدر المعتمد الجديد الوحيد.
                    </p>
                  </div>
                </div>
              </label>

              {/* Option 2: Add and Update */}
              <label
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  importStrategy === 'add_and_update'
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    name="importStrategy"
                    checked={importStrategy === 'add_and_update'}
                    onChange={() => setImportStrategy('add_and_update')}
                    className="mt-1 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      إضافة الجدد وتحديث السجلات الحالية
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      إضافة المسؤولين غير المسجلين، ومطابقة وتحديث هواتف وصلاحيات المسؤولين المسجلين سابقاً.
                    </p>
                  </div>
                </div>
              </label>

              {/* Option 3: Add only */}
              <label
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  importStrategy === 'add_only'
                    ? 'border-indigo-500 bg-indigo-50/50 shadow-sm'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    name="importStrategy"
                    checked={importStrategy === 'add_only'}
                    onChange={() => setImportStrategy('add_only')}
                    className="mt-1 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      إضافة السجلات الجديدة فقط
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      إدخال الأسماء غير الموجودة فقط، والإبقاء على كافة السجلات والبيانات السابقة دون أي تعديل.
                    </p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Validation & Preview Summary */}
          {validationReport && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  <span>نتائج الفحص والتحقق من الشيت ({validationReport.totalRows} صف):</span>
                </h3>
                <button
                  type="button"
                  onClick={handleRevalidate}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>إعادة الفحص</span>
                </button>
              </div>

              {/* Stat Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-slate-500 font-semibold">إجمالي الصفوف</div>
                  <div className="text-lg font-bold text-slate-900">{validationReport.totalRows}</div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="text-emerald-700 font-semibold">مسؤولون جدد</div>
                  <div className="text-lg font-bold text-emerald-800">{validationReport.newOfficials.length}</div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="text-blue-700 font-semibold">سجلات للتحديث</div>
                  <div className="text-lg font-bold text-blue-800">{validationReport.updatedOfficials.length}</div>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <div className="text-rose-700 font-semibold">صفوف مستبعدة</div>
                  <div className="text-lg font-bold text-rose-800">{validationReport.rejectedRows.length}</div>
                </div>
              </div>

              {/* Table Preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2">الاسم الكامل</th>
                      <th className="p-2">رقم الهاتف</th>
                      <th className="p-2">المديرية</th>
                      <th className="p-2">نطاق الصلاحيات</th>
                      <th className="p-2">المسمى الوظيفي</th>
                      <th className="p-2">الصلاحية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[...validationReport.newOfficials, ...validationReport.updatedOfficials].slice(0, 15).map((o, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 font-semibold text-slate-900">{o.fullName}</td>
                        <td className="p-2 font-mono text-slate-700" dir="ltr">{o.phone}</td>
                        <td className="p-2 text-slate-700">{o.district}</td>
                        <td className="p-2 text-slate-500 truncate max-w-xs">{o.scope}</td>
                        <td className="p-2 text-slate-600">{o.jobTitle}</td>
                        <td className="p-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                            {o.permissionLevel}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {validationReport.rejectionSummary.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>تنبيهات الاستبعاد:</span>
                  </div>
                  {validationReport.rejectionSummary.map((r, i) => (
                    <div key={i}>• {r}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Progress Bar & Status (During Execution) */}
          {isProcessing && (
            <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-5 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>{progressStage}</span>
                </div>
                <span className="font-mono text-sm">{progressPercent}%</span>
              </div>

              {/* Progress Bar Track */}
              <div className="w-full bg-indigo-200/80 rounded-full h-3.5 overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-l from-emerald-500 to-indigo-600 h-full rounded-full transition-all duration-300 ease-out shadow-sm"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>

              <div className="text-[11px] text-indigo-700 text-center">
                يرجى الانتظار حتى اكتمال معالجة وتثبيت سجلات الشيت...
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {validationReport
              ? `جاهز للاستيراد: ${totalValid} مسؤول (${validationReport.newOfficials.length} جديد + ${validationReport.updatedOfficials.length} تحديث)`
              : 'يرجى اختيار ملف الشيت للبدء'}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={!validationReport || totalValid === 0 || isProcessing}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition active:scale-95 ${
                importStrategy === 'replace_all'
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-900/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20'
              } disabled:bg-slate-300 disabled:shadow-none`}
            >
              {isProcessing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>
                {importStrategy === 'replace_all'
                  ? `استبدال السجل بالكامل (${totalValid} مسؤول)`
                  : `بدء استيراد الشيت (${totalValid} مسؤول)`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
