import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Users,
  UserCheck,
  UserPlus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  FileSpreadsheet,
  Upload,
  Download,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  Building,
  MapPin,
  Briefcase,
  History,
  FileText,
  HelpCircle,
  ExternalLink,
  Lock,
  Unlock,
  Layers,
  ArrowRight,
  ClipboardPaste,
  Check,
  Clock
} from 'lucide-react';
import {
  OfficialProfile,
  getAllStoredOfficials,
  saveStoredOfficials,
  getAllImportLogs,
  saveImportLog,
  ResponsibleImportValidator,
  ImportValidationReport,
  OfficialImportHistoryLog
} from '../data/officialsRegistry';
import { importedInitiatives } from '../importedData';
import { getStoredDecisions } from '../data/decisionsStore';
import OfficialsJurisdictionSheet from './OfficialsJurisdictionSheet';
import OfficialsExcelImportModal from './OfficialsExcelImportModal';

interface OfficialsManagementPortalProps {
  onBack?: () => void;
  onNavigateToInitiative?: (initiativeId: string) => void;
}

export default function OfficialsManagementPortal({
  onBack,
  onNavigateToInitiative
}: OfficialsManagementPortalProps) {
  const [officials, setOfficials] = useState<OfficialProfile[]>(() => getAllStoredOfficials());
  const [importLogs, setImportLogs] = useState<OfficialImportHistoryLog[]>(() => getAllImportLogs());
  const [activeTab, setActiveTab] = useState<'sheet' | 'list' | 'import' | 'add' | 'logs'>('sheet');
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [isImportingWithProgress, setIsImportingWithProgress] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStageText, setImportStageText] = useState('');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'linked_active' | 'unlinked' | 'pending' | 'suspended'>('all');
  const [selectedPermission, setSelectedPermission] = useState<'all' | 'admin' | 'executive' | 'supervisory' | 'field' | 'viewer'>('all');

  // Selected Official for viewing details
  const [viewingOfficial, setViewingOfficial] = useState<OfficialProfile | null>(null);
  const [editingOfficial, setEditingOfficial] = useState<OfficialProfile | null>(null);

  // Manual Add Form State
  const [newOfficialForm, setNewOfficialForm] = useState<Partial<OfficialProfile>>({
    fullName: '',
    phone: '',
    email: '',
    jobTitle: '',
    organization: 'وحدة التدخلات المركزية التنموية الطارئة',
    governorate: 'محافظة إب',
    district: 'مديرية ذي السفال',
    scope: '',
    role: 'مسؤول تنفيذي ميداني',
    permissionLevel: 'field',
    accountStatus: 'unlinked',
    assignedInitiativeIds: []
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Import State
  const [importFileText, setImportFileText] = useState<string>('');
  const [importFileName, setImportFileName] = useState<string>('');
  const [importParsedRows, setImportParsedRows] = useState<any[]>([]);
  const [columnHeaders, setColumnHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    fullName: 'الاسم الكامل',
    phone: 'رقم الهاتف',
    scope: 'منطقة ونطاق الصلاحيات',
    district: 'المديرية',
    jobTitle: 'المسمى الوظيفي',
    organization: 'الجهة التابع لها',
    role: 'الدور المؤسسي',
    permissionLevel: 'مستوى الصلاحية',
    accountStatus: 'حالة الحساب',
    email: 'البريد الإلكتروني',
    governorate: 'المحافظة',
    assignedInitiativeIds: 'المبادرات المسندة',
    notes: 'ملاحظات'
  });
  const [validationReport, setValidationReport] = useState<ImportValidationReport | null>(null);
  const [importMode, setImportMode] = useState<'replace_all' | 'add_and_update' | 'add_only'>('replace_all');
  const [importStatusMsg, setImportStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [importInputMethod, setImportInputMethod] = useState<'file' | 'paste'>('file');
  const [pasteText, setPasteText] = useState<string>('');

  // Districts list from real initiatives
  const districtsList = useMemo(() => {
    const set = new Set<string>();
    importedInitiatives.forEach(i => {
      if (i.district) set.add(i.district);
    });
    officials.forEach(o => {
      if (o.district && !o.district.includes('كافة مديريات')) {
        set.add(o.district);
      }
    });
    return Array.from(set).sort();
  }, [officials]);

  // Filtered Officials
  const filteredOfficials = useMemo(() => {
    return officials.filter(o => {
      const matchSearch =
        !searchTerm.trim() ||
        o.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.phone?.includes(searchTerm) ||
        o.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.organization?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDistrict = selectedDistrict === 'all' || o.district === selectedDistrict || o.district?.includes('كافة مديريات');
      const matchRole = selectedRole === 'all' || o.role === selectedRole;
      const matchStatus = selectedStatus === 'all' || o.accountStatus === selectedStatus;
      const matchPermission = selectedPermission === 'all' || o.permissionLevel === selectedPermission;

      return matchSearch && matchDistrict && matchRole && matchStatus && matchPermission;
    });
  }, [officials, searchTerm, selectedDistrict, selectedRole, selectedStatus, selectedPermission]);

  // Statistics
  const stats = useMemo(() => {
    const total = officials.length;
    const linked = officials.filter(o => o.accountStatus === 'linked_active').length;
    const unlinked = officials.filter(o => o.accountStatus === 'unlinked').length;
    const admins = officials.filter(o => o.permissionLevel === 'admin').length;
    const executives = officials.filter(o => o.permissionLevel === 'executive').length;
    const assigned = officials.filter(o => (o.assignedInitiativeIds?.length || 0) > 0).length;
    return { total, linked, unlinked, admins, executives, assigned };
  }, [officials]);

  // Handle Save / Delete
  const handleUpdateOfficial = (updated: OfficialProfile) => {
    const list = officials.map(o => (o.id === updated.id ? updated : o));
    setOfficials(list);
    saveStoredOfficials(list);
    setEditingOfficial(null);
    setViewingOfficial(updated);
  };

  const handleDeleteOfficial = (id: string) => {
    if (id === 'off_admin_001' || id === 'off_admin_002') {
      alert('لا يمكن حذف حساب المسؤول الإداري التأسيسي الأعلى للنظام.');
      return;
    }
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف سجل هذا المسؤول؟')) return;
    const list = officials.filter(o => o.id !== id);
    setOfficials(list);
    saveStoredOfficials(list);
    if (viewingOfficial?.id === id) setViewingOfficial(null);
  };

  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!newOfficialForm.fullName || newOfficialForm.fullName.trim().length < 3) {
      setFormError('يرجى إدخال الاسم الكامل الثلاثي أو الرباعي للمسؤول.');
      return;
    }
    if (!newOfficialForm.phone && !newOfficialForm.email) {
      setFormError('يرجى إدخال رقم هاتف معتمد أو بريد إلكتروني.');
      return;
    }

    const newId = `off_${Date.now()}_${Date.now() % 1000}`;
    const newOfficial: OfficialProfile = {
      id: newId,
      fullName: newOfficialForm.fullName.trim(),
      phone: newOfficialForm.phone?.trim() || '',
      email: newOfficialForm.email?.trim() || undefined,
      jobTitle: newOfficialForm.jobTitle?.trim() || 'مسؤول تنفيذي ميداني',
      organization: newOfficialForm.organization?.trim() || 'وحدة التدخلات التنموية',
      governorate: newOfficialForm.governorate || 'محافظة إب',
      district: newOfficialForm.district || 'مديرية ذي السفال',
      scope: newOfficialForm.scope?.trim() || `نطاق ${newOfficialForm.district}`,
      role: newOfficialForm.role?.trim() || 'مسؤول ميداني',
      permissionLevel: (newOfficialForm.permissionLevel as any) || 'field',
      accountStatus: newOfficialForm.email ? 'linked_active' : 'unlinked',
      assignedInitiativeIds: newOfficialForm.assignedInitiativeIds || [],
      assignedDecisionIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: newOfficialForm.notes
    };

    const updatedList = [newOfficial, ...officials];
    setOfficials(updatedList);
    saveStoredOfficials(updatedList);

    setFormSuccess(`تمت إضافة المسؤول [${newOfficial.fullName}] بنجاح وحفظه بالسجل المؤسسي.`);
    setNewOfficialForm({
      fullName: '',
      phone: '',
      email: '',
      jobTitle: '',
      organization: 'وحدة التدخلات المركزية التنموية الطارئة',
      governorate: 'محافظة إب',
      district: 'مديرية ذي السفال',
      scope: '',
      role: 'مسؤول تنفيذي ميداني',
      permissionLevel: 'field',
      accountStatus: 'unlinked',
      assignedInitiativeIds: []
    });
  };

  // Process rows extracted from file or paste
  const processRawRows = (rows: any[], sourceName: string) => {
    if (!rows || rows.length === 0) {
      setImportStatusMsg({ type: 'error', text: 'الملف أو النص المضاف لا يحتوي على أي صفوف بيانات صالحة.' });
      return;
    }

    // Extract headers from first non-empty row keys
    const headers = Object.keys(rows[0]).filter(k => k && !k.startsWith('__EMPTY'));
    setColumnHeaders(headers);
    setImportParsedRows(rows);

    // Auto-detect Arabic column mappings
    const mapping: Record<string, string> = { ...columnMapping };
    headers.forEach(h => {
      const fieldKey = ResponsibleImportValidator.getArabicFieldKey(h);
      if (fieldKey && mapping[fieldKey] !== undefined) {
        mapping[fieldKey] = h;
      }
    });
    setColumnMapping(mapping);

    // Run validator
    const report = ResponsibleImportValidator.validateImportData(rows, officials, mapping);
    setValidationReport(report);

    setImportStatusMsg({
      type: report.isValid ? 'success' : 'error',
      text: `تم استخراج ${rows.length} صف من [${sourceName}]. ${report.newOfficials.length} جديد، ${report.updatedOfficials.length} للتحديث، ${report.rejectedRows.length} مستبعد.`
    });
  };

  // CSV / TSV Text Parser
  const parseCSVText = (text: string, sourceName: string) => {
    try {
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lines.length === 0) {
        setImportStatusMsg({ type: 'error', text: 'الملف فارغ أو لا يحتوي على صفوف بيانات.' });
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

      processRawRows(rows, sourceName);
    } catch (err: any) {
      setImportStatusMsg({ type: 'error', text: `فشل قراءة الملف: ${err.message || err}` });
    }
  };

  // Excel & File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportStatusMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
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
          setImportStatusMsg({ type: 'error', text: `فشل قراءة ملف الإكسل: ${err.message || err}` });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setImportFileText(text);
        parseCSVText(text, file.name);
      };
      reader.readAsText(file);
    }
  };

  // Direct paste handler
  const handlePasteSubmit = () => {
    if (!pasteText.trim()) {
      setImportStatusMsg({ type: 'error', text: 'يرجى لصق نص أو جدول البيانات أولاً.' });
      return;
    }
    parseCSVText(pasteText, 'لصق مباشر من جدول إكسل / جوجل شيت');
  };

  const handleRunValidation = () => {
    if (importParsedRows.length === 0) return;
    const report = ResponsibleImportValidator.validateImportData(importParsedRows, officials, columnMapping);
    setValidationReport(report);
  };

  const handleCommitImport = () => {
    if (!validationReport) return;

    const validOfficials = [...validationReport.newOfficials, ...validationReport.updatedOfficials];
    if (validOfficials.length === 0) {
      setImportStatusMsg({ type: 'error', text: 'لا توجد سجلات صالحة للاستيراد.' });
      return;
    }

    if (importMode === 'replace_all') {
      const confirmed = window.confirm(
        `⚠️ تنبيه هام: سيتم استبدال كافة الأسماء والمسؤولين المسجلين سابقاً (${officials.length} مسؤول) بالسجلات الجديدة المستوردة من الشيت (${validOfficials.length} مسؤول).\n\nهل تريد المتابعة وتأكيد الاستبدال الكامل؟`
      );
      if (!confirmed) return;
    }

    setIsImportingWithProgress(true);
    setImportProgress(15);
    setImportStageText('جاري فحص وتدقيق أرقام الهواتف ونطاق الصلاحيات...');

    setTimeout(() => {
      setImportProgress(50);
      setImportStageText(
        importMode === 'replace_all'
          ? 'جاري تفريغ السجلات السابقة وتثبيت الشيت المستورد كلياً...'
          : 'جاري دمج وتحديث السجلات المؤسسية...'
      );

      setTimeout(() => {
        setImportProgress(85);
        setImportStageText('جاري تحديث السجل المؤسسي والتحقق من حسابات الدخول...');

        setTimeout(() => {
          let updatedList: OfficialProfile[] = [];

          if (importMode === 'replace_all') {
            // Preserve super admins to avoid lockouts
            const superAdmins = officials.filter(o => o.id === 'off_admin_001' || o.id === 'off_admin_002');
            const hasSuperAdminInImport = validOfficials.some(o => o.id === 'off_admin_001' || o.phone === '777252525');
            if (!hasSuperAdminInImport && superAdmins.length > 0) {
              updatedList = [...superAdmins, ...validOfficials];
            } else {
              updatedList = [...validOfficials];
            }
          } else if (importMode === 'add_and_update') {
            let list = [...officials];
            if (validationReport.newOfficials.length > 0) {
              list = [...validationReport.newOfficials, ...list];
            }
            if (validationReport.updatedOfficials.length > 0) {
              const updateMap = new Map(validationReport.updatedOfficials.map(o => [o.id, o]));
              list = list.map(o => updateMap.get(o.id) || o);
            }
            updatedList = list;
          } else {
            // Add only
            updatedList = [...validationReport.newOfficials, ...officials];
          }

          setOfficials(updatedList);
          saveStoredOfficials(updatedList);

          // Save import audit log
          const log: OfficialImportHistoryLog = {
            id: `log_${Date.now()}`,
            timestamp: new Date().toISOString(),
            importedBy: 'م. عيسى ناجي القادري (مدير النظام)',
            fileName: importFileName || 'استيراد شيت إكسل المعتمد',
            totalRows: validationReport.totalRows,
            addedCount: importMode === 'replace_all' ? validOfficials.length : validationReport.newOfficials.length,
            updatedCount: importMode === 'add_and_update' ? validationReport.updatedOfficials.length : 0,
            rejectedCount: validationReport.rejectedRows.length,
            rejectionReasons: validationReport.rejectionSummary,
            dataVersion: importMode === 'replace_all' ? 'v2.0-REPLACED-ALL' : 'v1.0-SSoT'
          };
          saveImportLog(log);
          setImportLogs([log, ...importLogs]);

          setImportProgress(100);
          setImportStageText('اكتمل الاستيراد بنجاح 100%');
          setIsImportingWithProgress(false);

          setImportStatusMsg({
            type: 'success',
            text:
              importMode === 'replace_all'
                ? `تم بنجاح استبدال السجل بالكامل وتثبيت ${updatedList.length} مسؤول من الشيت المستورد.`
                : `تم استيراد ${validationReport.newOfficials.length} مسؤول جديد وتحديث ${importMode === 'add_and_update' ? validationReport.updatedOfficials.length : 0} سجل بنجاح.`
          });

          setImportParsedRows([]);
          setValidationReport(null);
          setImportFileText('');
          setPasteText('');
        }, 300);
      }, 400);
    }, 350);
  };

  // Download Standard Excel Template (.xlsx)
  const handleDownloadExcelTemplate = () => {
    const sampleData = [
      {
        'الاسم الكامل': 'أ. محمد حميد الشامي',
        'رقم الهاتف': '777009009',
        'منطقة ونطاق الصلاحيات': 'نطاق مديرية ذي السفال (عزل: ريمان، حبير، وادي ضباء، الصفة، بني عبداله، شوائط)',
        'المديرية': 'مديرية ذي السفال',
        'المسمى الوظيفي': 'مدير عام المديرية - رئيس المجلس المحلي',
        'الجهة التابع لها': 'السلطة المحلية بمديرية ذي السفال',
        'مستوى الصلاحية': 'تنفيذي',
        'الدور المؤسسي': 'مدير عام المديرية',
        'حالة الحساب': 'نشط وموثق',
        'البريد الإلكتروني': 'dhisufal_mgr@ebb.gov.ye',
        'المحافظة': 'محافظة إب',
        'المبادرات المسندة': '726, 728',
        'ملاحظات': 'المسؤول التنفيذي المباشر لاعتماد المبادرات والمطابقة'
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
        'ملاحظات': 'تنسيق المساهمات المجتمعية العينية والنقدية'
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

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['الاسم الكامل', 'رقم الهاتف', 'منطقة ونطاق الصلاحيات', 'المديرية', 'المسمى الوظيفي', 'الجهة التابع لها', 'مستوى الصلاحية', 'الدور المؤسسي', 'حالة الحساب', 'البريد الإلكتروني', 'المحافظة', 'المبادرات المسندة', 'ملاحظات'];
    const rows = officials.map(o => [
      `"${(o.fullName || '').replace(/"/g, '""')}"`,
      `"${o.phone || ''}"`,
      `"${(o.scope || '').replace(/"/g, '""')}"`,
      `"${(o.district || '').replace(/"/g, '""')}"`,
      `"${(o.jobTitle || '').replace(/"/g, '""')}"`,
      `"${(o.organization || '').replace(/"/g, '""')}"`,
      `"${o.permissionLevel === 'admin' ? 'مدير نظام' : o.permissionLevel === 'executive' ? 'تنفيذي' : o.permissionLevel === 'supervisory' ? 'إشرافي' : o.permissionLevel === 'viewer' ? 'مشاهد' : 'ميداني'}"`,
      `"${(o.role || '').replace(/"/g, '""')}"`,
      `"${o.accountStatus === 'linked_active' ? 'نشط وموثق' : o.accountStatus === 'suspended' ? 'معلق' : o.accountStatus === 'pending' ? 'قيد المراجعة' : 'بيانات اتصال'}"`,
      `"${o.email || ''}"`,
      `"${o.governorate || 'محافظة إب'}"`,
      `"${(o.assignedInitiativeIds || []).join(';')}"`,
      `"${(o.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `سجل_المسؤولين_والصلاحيات_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderPermissionBadge = (perm: string) => {
    switch (perm) {
      case 'super_admin':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">مدير عام النظام</span>;
      case 'executive':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">تنفيذي ومعتمد</span>;
      case 'supervisor':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">إشرافي ورقابي</span>;
      case 'field':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">ميداني وتوثيق</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">مشاهد ومطالعة</span>;
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'linked_active':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200"><CheckCircle2 className="w-3 h-3" /> نشط وموثق</span>;
      case 'suspended':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200"><AlertTriangle className="w-3 h-3" /> معلق</span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200"><Clock className="w-3 h-3" /> قيد المراجعة</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200"><Lock className="w-3 h-3 text-slate-400" /> بيانات اتصال</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans" dir="rtl">
      {/* Header & Breadcrumb */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              title="رجوع"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">سجل إدارة المسؤولين والصلاحيات المؤسسية</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                RBAC Enterprise
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              إدارة بيانات القيادات التنفيذية، استيراد شيت المسؤولين، ضبط الصلاحيات، وربط التكليفات الميدانية بالمبادرات والقرارات.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowExcelModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-xs md:text-sm shadow-md border border-emerald-400/30 transition active:scale-95"
            title="استيراد شيت إكسل بأسماء وأرقام هواتف وصلاحيات المسؤولين مع مؤشر النسبة وإمكانية استبدال الكل"
          >
            <Upload className="w-4 h-4 text-emerald-200" />
            <span>استيراد شيت إكسل (Excel)</span>
          </button>
          <button
            onClick={handleDownloadExcelTemplate}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs transition-colors shadow-sm"
            title="تحميل قالب إكسل معتمد بكافة الأعمدة والبيانات الاسترشادية باللغة العربية"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>قالب إكسل استرشادي (.xlsx)</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>تصدير السجل (CSV)</span>
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة مسؤول جديد</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 mb-1">إجمالي المسؤولين</div>
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-1">مسؤول مسجل بالسجل</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-emerald-600 mb-1">حسابات موثقة ومفعلة</div>
          <div className="text-2xl font-bold text-emerald-700">{stats.linked}</div>
          <div className="text-[11px] text-emerald-500 mt-1">مرتبطة بحساب دخول نشط</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-amber-600 mb-1">بيانات غير مرتبطة</div>
          <div className="text-2xl font-bold text-amber-700">{stats.unlinked}</div>
          <div className="text-[11px] text-amber-500 mt-1">بيانات اتصال فقط</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-indigo-600 mb-1">مديرو النظام (Admins)</div>
          <div className="text-2xl font-bold text-indigo-700">{stats.admins}</div>
          <div className="text-[11px] text-indigo-500 mt-1">صلاحية إدارية عليا</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-blue-600 mb-1">القيادة التنفيذية</div>
          <div className="text-2xl font-bold text-blue-700">{stats.executives}</div>
          <div className="text-[11px] text-blue-500 mt-1">اعتماد ومتابعة</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-purple-600 mb-1">مسند إليهم مبادرات</div>
          <div className="text-2xl font-bold text-purple-700">{stats.assigned}</div>
          <div className="text-[11px] text-purple-500 mt-1">مكلفون بمشاريع محددة</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl px-2 pt-2 shadow-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('sheet')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors shrink-0 ${
            activeTab === 'sheet'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
          <span>شيت الأسماء والهواتف ومناطق الصلاحيات 📋</span>
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
            شيت شامل
          </span>
        </button>

        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors shrink-0 ${
            activeTab === 'list'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>قائمة المسؤولين والتكليفات ({filteredOfficials.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('import')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors shrink-0 ${
            activeTab === 'import'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>استيراد وتحديث من الشيت / Excel</span>
        </button>

        <button
          onClick={() => setActiveTab('add')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors shrink-0 ${
            activeTab === 'add'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>إضافة مسؤول يدوياً</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors shrink-0 ${
            activeTab === 'logs'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>سجل تدقيق الاستيراد ({importLogs.length})</span>
        </button>
      </div>

      {/* TAB 0: OFFICIALS JURISDICTION SHEET */}
      {activeTab === 'sheet' && (
        <OfficialsJurisdictionSheet
          onSelectOfficial={(official) => {
            setViewingOfficial(official);
          }}
          onNavigateToInitiative={onNavigateToInitiative}
        />
      )}

      {/* TAB 1: OFFICIALS LIST */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="بحث بالاسم، رقم الهاتف، البريد، أو الوظيفة..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-3 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <select
                value={selectedDistrict}
                onChange={e => setSelectedDistrict(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">كافة المديريات</option>
                {districtsList.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedPermission}
                onChange={e => setSelectedPermission(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">كافة مستويات الصلاحية</option>
                <option value="admin">مدير نظام (Admin)</option>
                <option value="executive">تنفيذي (Executive)</option>
                <option value="supervisory">إشرافي (Supervisory)</option>
                <option value="field">ميداني (Field)</option>
                <option value="viewer">مشاهد (Viewer)</option>
              </select>
            </div>

            <div>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">كافة حالات الحساب</option>
                <option value="linked_active">حساب موثق ومفعل</option>
                <option value="unlinked">بيانات غير مرتبطة بحساب</option>
                <option value="pending">قيد التفعيل</option>
                <option value="suspended">معلق مؤقتاً</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">المسؤول</th>
                    <th className="py-3 px-4">الاتصال</th>
                    <th className="py-3 px-4">المسمى والجهة</th>
                    <th className="py-3 px-4">المديرية والنطاق</th>
                    <th className="py-3 px-4">الصلاحية المؤسسية</th>
                    <th className="py-3 px-4">حالة الحساب</th>
                    <th className="py-3 px-4">المبادرات المسندة</th>
                    <th className="py-3 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOfficials.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        لا يوجد مسؤولون مطابقون لخيارات البحث والفلترة الحالية.
                      </td>
                    </tr>
                  ) : (
                    filteredOfficials.map(official => (
                      <tr key={official.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{official.fullName}</div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">{official.id}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span dir="ltr">{official.phone || 'غير مسجل'}</span>
                          </div>
                          {official.email && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <span dir="ltr">{official.email}</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">{official.jobTitle}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{official.organization}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-slate-800 text-xs">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{official.district}</span>
                          </div>
                          {official.scope && (
                            <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{official.scope}</div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                              official.permissionLevel === 'admin'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : official.permissionLevel === 'executive'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : official.permissionLevel === 'supervisory'
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                : 'bg-slate-100 text-slate-800 border border-slate-200'
                            }`}
                          >
                            {official.permissionLevel === 'admin' && '👑 مدير نظام (Admin)'}
                            {official.permissionLevel === 'executive' && '🏛️ تنفيذي (Executive)'}
                            {official.permissionLevel === 'supervisory' && '🔍 إشرافي (Supervisory)'}
                            {official.permissionLevel === 'field' && '👷‍♂️ ميداني (Field)'}
                            {official.permissionLevel === 'viewer' && '👁️ مشاهد (Viewer)'}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          {official.accountStatus === 'linked_active' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>حساب موثق</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span>غير مرتبط بحساب</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {official.assignedInitiativeIds && official.assignedInitiativeIds.length > 0 ? (
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs">
                                {official.assignedInitiativeIds.length} مبادرة
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">لا يوجد مبادرات مسندة</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setViewingOfficial(official)}
                              className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="عرض التفاصيل والتكليفات"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingOfficial(official)}
                              className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              title="تعديل"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteOfficial(official.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: IMPORT SHEET & VALIDATION */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          {/* Instructions Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>تعليمات ومواصفات استيراد شيت مسؤولي المديريات</span>
              </h3>

              <button
                onClick={handleDownloadExcelTemplate}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5 self-start"
              >
                <Download className="w-4 h-4" />
                <span>تحميل نموذج وقالب إكسل معتمد (.xlsx)</span>
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              يدعم النظام استيراد ملفات الإكسل (<strong className="text-slate-800 font-semibold">.xlsx, .xls</strong>) وكذلك ملفات (<strong className="text-slate-800 font-semibold">.csv, .tsv</strong>) أو اللصق المباشر من جداول Google Sheets. يتعرف النظام تلقائياً على الأعمدة العربية دون الحاجة لأي رموز برمجية.
            </p>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-slate-800 text-xs">الأعمدة المعتمدة ومسمياتها باللغة العربية:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-slate-700">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="font-bold text-emerald-700">1. الاسم الكامل</span> (إلزامي)
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="font-bold text-emerald-700">2. رقم الهاتف</span> (إلزامي)
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-800">3. منطقة ونطاق الصلاحيات</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-800">4. المديرية</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-800">5. المسمى الوظيفي</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-800">6. الجهة التابع لها</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-800">7. مستوى الصلاحية</span> (تنفيذي/ميداني/إشرافي)
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-800">8. الدور المؤسسي</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-800">9. حالة الحساب</span> (نشط/بيانات اتصال)
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-800">10. البريد الإلكتروني</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-800">11. المحافظة</span> (محافظة إب)
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-800">12. المبادرات المسندة</span> (أرقام المبادرات)
                </div>
              </div>
            </div>
          </div>

          {/* Upload Method Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setImportInputMethod('file')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                importInputMethod === 'file'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>رفع ملف إكسل أو CSV (.xlsx, .xls, .csv)</span>
            </button>
            <button
              onClick={() => setImportInputMethod('paste')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                importInputMethod === 'paste'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <ClipboardPaste className="w-4 h-4" />
              <span>لصق مباشر من جدول إكسل أو Google Sheets</span>
            </button>
          </div>

          {/* Upload Area */}
          {importInputMethod === 'file' ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 text-center transition-colors">
                <FileSpreadsheet className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                <p className="text-base font-bold text-slate-800">اختر ملف إكسل أو CSV لاستيراد المسؤولين</p>
                <p className="text-xs text-slate-500 mt-1">يدعم ملفات .xlsx و .xls و .csv و .tsv باللغة العربية الكاملة</p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.tsv,.txt"
                  onChange={handleFileUpload}
                  className="mt-4 block mx-auto text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
              </div>

              {importStatusMsg && (
                <div
                  className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
                    importStatusMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {importStatusMsg.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
                  )}
                  <span>{importStatusMsg.text}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  الصق محتوى جدول الإكسل أو شيت جوجل هنا (نسخ ولصق مع صف العناوين):
                </label>
                <textarea
                  rows={6}
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  placeholder="الاسم الكامل	رقم الهاتف	منطقة ونطاق الصلاحيات	المديرية	المسمى الوظيفي	الجهة التابع لها	مستوى الصلاحية
أ. محمد حميد الشامي	777009009	نطاق مديرية ذي السفال	مديرية ذي السفال	مدير عام المديرية	السلطة المحلية	تنفيذي"
                  className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={handlePasteSubmit}
                  disabled={!pasteText.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>معالجة وفحص البيانات المنسوخة</span>
                </button>

                <button
                  onClick={() => setPasteText('')}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  مسح النص
                </button>
              </div>

              {importStatusMsg && (
                <div
                  className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
                    importStatusMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {importStatusMsg.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
                  )}
                  <span>{importStatusMsg.text}</span>
                </div>
              )}
            </div>
          )}

          {/* Column Mapping & Preview */}
          {columnHeaders.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-600" />
                  <span>مطابقة أعمدة الشيت باللغة العربية (Column Mapping)</span>
                </h3>
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  تم التعرف التلقائي الذكي على الحقول
                </span>
              </div>
              <p className="text-xs text-slate-500">
                تأكد من مطابقة كل حقل بالعمود المقابل له في ملف الشيت المرفوع:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">الاسم الكامل *</label>
                  <select
                    value={columnMapping.fullName}
                    onChange={e => setColumnMapping({ ...columnMapping, fullName: e.target.value })}
                    className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    {columnHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">رقم الهاتف / الجوال *</label>
                  <select
                    value={columnMapping.phone}
                    onChange={e => setColumnMapping({ ...columnMapping, phone: e.target.value })}
                    className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    {columnHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">منطقة ونطاق الصلاحيات</label>
                  <select
                    value={columnMapping.scope}
                    onChange={e => setColumnMapping({ ...columnMapping, scope: e.target.value })}
                    className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="">(تلقائي حسب المديرية)</option>
                    {columnHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">المديرية</label>
                  <select
                    value={columnMapping.district}
                    onChange={e => setColumnMapping({ ...columnMapping, district: e.target.value })}
                    className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    {columnHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">المسمى الوظيفي</label>
                  <select
                    value={columnMapping.jobTitle}
                    onChange={e => setColumnMapping({ ...columnMapping, jobTitle: e.target.value })}
                    className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    {columnHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">الجهة / الوحدة التابع لها</label>
                  <select
                    value={columnMapping.organization}
                    onChange={e => setColumnMapping({ ...columnMapping, organization: e.target.value })}
                    className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    {columnHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">مستوى الصلاحية</label>
                  <select
                    value={columnMapping.permissionLevel}
                    onChange={e => setColumnMapping({ ...columnMapping, permissionLevel: e.target.value })}
                    className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="">(افتراضي: ميداني)</option>
                    {columnHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">البريد الإلكتروني</label>
                  <select
                    value={columnMapping.email}
                    onChange={e => setColumnMapping({ ...columnMapping, email: e.target.value })}
                    className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="">(غير متوفر)</option>
                    {columnHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleRunValidation}
                  className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors"
                >
                  إعادة فحص ومطابقة الأعمدة
                </button>
              </div>
            </div>
          )}

          {/* Validation Summary Report & Row Preview */}
          {validationReport && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>نتائج فحص الشيت والصفوف المستخرجة</span>
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500 font-semibold">إجمالي الصفوف المستخرجة</div>
                  <div className="text-xl font-bold text-slate-800">{validationReport.totalRows}</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="text-xs text-emerald-700 font-semibold">مسؤولون جدد للإضافة</div>
                  <div className="text-xl font-bold text-emerald-800">{validationReport.newOfficials.length}</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="text-xs text-blue-700 font-semibold">سجلات مطابقة للتحديث</div>
                  <div className="text-xl font-bold text-blue-800">{validationReport.updatedOfficials.length}</div>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <div className="text-xs text-rose-700 font-semibold">صفوف مستبعدة (أخطاء)</div>
                  <div className="text-xl font-bold text-rose-800">{validationReport.rejectedRows.length}</div>
                </div>
              </div>

              {/* Rejection summary if any */}
              {validationReport.rejectionSummary.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>ملاحظات استبعاد الصفوف غير المطابقة:</span>
                  </div>
                  {validationReport.rejectionSummary.map((reason, idx) => (
                    <div key={idx}>• {reason}</div>
                  ))}
                </div>
              )}

              {/* Live Preview Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-slate-600" />
                  <span>معاينة الصفوف الجاهزة للاستيراد ({validationReport.newOfficials.length + validationReport.updatedOfficials.length} سجل):</span>
                </h4>

                <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-80 overflow-y-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 text-slate-700 sticky top-0 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">النوع</th>
                        <th className="py-2.5 px-3">الاسم الكامل</th>
                        <th className="py-2.5 px-3">رقم الهاتف</th>
                        <th className="py-2.5 px-3">منطقة ونطاق الصلاحيات</th>
                        <th className="py-2.5 px-3">المديرية</th>
                        <th className="py-2.5 px-3">المسمى الوظيفي</th>
                        <th className="py-2.5 px-3">مستوى الصلاحية</th>
                        <th className="py-2.5 px-3">حالة الحساب</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {validationReport.newOfficials.map((o, idx) => (
                        <tr key={`new_${idx}`} className="hover:bg-emerald-50/50">
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              + جديد
                            </span>
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{o.fullName}</td>
                          <td className="py-2 px-3 font-mono text-slate-700" dir="ltr">{o.phone}</td>
                          <td className="py-2 px-3 text-slate-600 max-w-xs truncate">{o.scope}</td>
                          <td className="py-2 px-3 text-slate-700">{o.district}</td>
                          <td className="py-2 px-3 text-slate-600">{o.jobTitle}</td>
                          <td className="py-2 px-3">{renderPermissionBadge(o.permissionLevel)}</td>
                          <td className="py-2 px-3">{renderStatusBadge(o.accountStatus)}</td>
                        </tr>
                      ))}
                      {validationReport.updatedOfficials.map((o, idx) => (
                        <tr key={`upd_${idx}`} className="hover:bg-blue-50/50">
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">
                              🔄 تحديث
                            </span>
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{o.fullName}</td>
                          <td className="py-2 px-3 font-mono text-slate-700" dir="ltr">{o.phone}</td>
                          <td className="py-2 px-3 text-slate-600 max-w-xs truncate">{o.scope}</td>
                          <td className="py-2 px-3 text-slate-700">{o.district}</td>
                          <td className="py-2 px-3 text-slate-600">{o.jobTitle}</td>
                          <td className="py-2 px-3">{renderPermissionBadge(o.permissionLevel)}</td>
                          <td className="py-2 px-3">{renderStatusBadge(o.accountStatus)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Progress Indicator if importing */}
              {isImportingWithProgress && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                      <span>{importStageText}</span>
                    </div>
                    <span className="font-mono">{importProgress}%</span>
                  </div>
                  <div className="w-full bg-indigo-200 rounded-full h-3 overflow-hidden p-0.5">
                    <div
                      className="bg-gradient-to-l from-emerald-500 to-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Import Options & Action */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-semibold text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace_all'}
                      onChange={() => setImportMode('replace_all')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-bold text-amber-900 block">استبدال الشيت بكل الأسماء السابقة</span>
                      <span className="text-[10px] text-amber-700 block">حذف السجلات السابقة وتثبيت الشيت الجديد</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'add_and_update'}
                      onChange={() => setImportMode('add_and_update')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-bold text-emerald-900 block">إضافة الجدد وتحديث السجلات</span>
                      <span className="text-[10px] text-emerald-700 block">دمج السجلات وتحديث الهواتف والصلاحيات</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'add_only'}
                      onChange={() => setImportMode('add_only')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">إضافة السجلات الجديدة فقط</span>
                      <span className="text-[10px] text-slate-500 block">تخطي أي مسؤول مسجل مسبقاً</span>
                    </div>
                  </label>
                </div>

                <button
                  onClick={handleCommitImport}
                  disabled={
                    (validationReport.newOfficials.length === 0 && validationReport.updatedOfficials.length === 0) ||
                    isImportingWithProgress
                  }
                  className={`px-6 py-2.5 text-white font-bold text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 ${
                    importMode === 'replace_all'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  } disabled:bg-slate-300`}
                >
                  {isImportingWithProgress ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>
                    {importMode === 'replace_all'
                      ? `استبدال السجل بالكامل (${validationReport.newOfficials.length + validationReport.updatedOfficials.length} مسؤول)`
                      : `تأكيد الاستيراد (${validationReport.newOfficials.length + (importMode === 'add_and_update' ? validationReport.updatedOfficials.length : 0)} مسؤول)`}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MANUAL ADD FORM */}
      {activeTab === 'add' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-4xl mx-auto space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              <span>إضافة مسؤول رسمي جديد إلى السجل المؤسسي</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              تسجيل بيانات المسؤول التنفيذي، جهة عمله، والمديريات والمبادرات المكلف بمتابعتها.
            </p>
          </div>

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          <form onSubmit={handleManualAddSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">الاسم الكامل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: م. أحمد صالح الحميري"
                  value={newOfficialForm.fullName}
                  onChange={e => setNewOfficialForm({ ...newOfficialForm, fullName: e.target.value })}
                  className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">رقم الهاتف / الجوال *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: 777123456"
                  value={newOfficialForm.phone}
                  onChange={e => setNewOfficialForm({ ...newOfficialForm, phone: e.target.value })}
                  className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  placeholder="name@organization.gov.ye"
                  value={newOfficialForm.email}
                  onChange={e => setNewOfficialForm({ ...newOfficialForm, email: e.target.value })}
                  className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">المسمى الوظيفي</label>
                <input
                  type="text"
                  placeholder="مثال: مهندس فني ميداني / رئيس لجنة مجتمعية"
                  value={newOfficialForm.jobTitle}
                  onChange={e => setNewOfficialForm({ ...newOfficialForm, jobTitle: e.target.value })}
                  className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">الجهة / الوحدة</label>
                <input
                  type="text"
                  placeholder="مثال: وحدة التدخلات المركزية / السلطة المحلية"
                  value={newOfficialForm.organization}
                  onChange={e => setNewOfficialForm({ ...newOfficialForm, organization: e.target.value })}
                  className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">المديرية</label>
                <select
                  value={newOfficialForm.district}
                  onChange={e => setNewOfficialForm({ ...newOfficialForm, district: e.target.value })}
                  className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="كافة مديريات محافظة إب (20 مديرية)">كافة مديريات محافظة إب (20 مديرية)</option>
                  {districtsList.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">مستوى الصلاحية المؤسسية</label>
                <select
                  value={newOfficialForm.permissionLevel}
                  onChange={e => setNewOfficialForm({ ...newOfficialForm, permissionLevel: e.target.value as any })}
                  className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="field">👷‍♂️ ميداني (Field - رفع وتقارير)</option>
                  <option value="supervisory">🔍 إشرافي (Supervisory - رقابة وفحص)</option>
                  <option value="executive">🏛️ تنفيذي (Executive - اعتماد وإصدار قرار)</option>
                  <option value="viewer">👁️ مشاهد (Viewer - قراءة فقط)</option>
                  <option value="admin">👑 مدير نظام (Admin - إدارة شاملة)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">النطاق الميداني المخصص</label>
                <input
                  type="text"
                  placeholder="مثال: عزلتي السارة والمجاهد بذي السفال"
                  value={newOfficialForm.scope}
                  onChange={e => setNewOfficialForm({ ...newOfficialForm, scope: e.target.value })}
                  className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>حفظ المسؤول بالسجل المؤسسي</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: IMPORT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 text-sm flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600" />
            <span>سجل تدقيق عمليات استيراد بيانات المسؤولين</span>
          </div>

          <div className="divide-y divide-slate-100">
            {importLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                لم يتم تسجيل أي عمليات استيراد سابقة حتى الآن.
              </div>
            ) : (
              importLogs.map(log => (
                <div key={log.id} className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm">
                  <div>
                    <div className="font-semibold text-slate-900 flex items-center gap-2">
                      <span>ملف: {log.fileName}</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                        {new Date(log.timestamp).toLocaleString('ar-YE')}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      المنفذ: {log.importedBy} | إصدار البيانات: {log.dataVersion}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-100 font-semibold">
                      +{log.addedCount} مسؤول جديد
                    </span>
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100 font-semibold">
                      {log.updatedCount} تحديث
                    </span>
                    {log.rejectedCount > 0 && (
                      <span className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded-lg border border-rose-100 font-semibold">
                        {log.rejectedCount} مستبعد
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* OFFICIAL DETAILS MODAL */}
      {viewingOfficial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg border border-emerald-200">
                  {viewingOfficial.fullName.slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{viewingOfficial.fullName}</h3>
                  <p className="text-xs text-slate-500">{viewingOfficial.jobTitle} - {viewingOfficial.organization}</p>
                </div>
              </div>

              <button
                onClick={() => setViewingOfficial(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-1">رقم الهاتف:</span>
                <span className="font-semibold text-slate-800 text-sm" dir="ltr">{viewingOfficial.phone || 'غير متوفر'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-1">البريد الإلكتروني:</span>
                <span className="font-semibold text-slate-800 text-sm" dir="ltr">{viewingOfficial.email || 'غير متوفر'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-1">المديرية والنطاق:</span>
                <span className="font-semibold text-slate-800">{viewingOfficial.district}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-1">مستوى الصلاحية:</span>
                <span className="font-semibold text-slate-800">{viewingOfficial.permissionLevel}</span>
              </div>
            </div>

            {/* Assigned Initiatives */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <span>المبادرات المسندة في المصدر المرجعي (725 مبادرة):</span>
              </h4>
              {viewingOfficial.assignedInitiativeIds && viewingOfficial.assignedInitiativeIds.length > 0 ? (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {viewingOfficial.assignedInitiativeIds.map(initId => {
                    const init = importedInitiatives.find(i => i.id === initId || String(i.initiativeNumber) === initId);
                    return (
                      <div
                        key={initId}
                        onClick={() => {
                          if (onNavigateToInitiative) {
                            onNavigateToInitiative(initId);
                            setViewingOfficial(null);
                          }
                        }}
                        className="p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">{init ? init.name : `مبادرة رقم #${initId}`}</div>
                          <div className="text-[11px] text-slate-500">{init ? `${init.district} - ${init.status}` : 'معرف مبادرة معتمد'}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                  لا توجد مبادرات مسندة لهذا المسؤول حتى الآن.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingOfficial(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingOfficial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">تعديل بيانات المسؤول</h3>
              <button onClick={() => setEditingOfficial(null)} className="text-slate-400">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  value={editingOfficial.fullName}
                  onChange={e => setEditingOfficial({ ...editingOfficial, fullName: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">الهاتف</label>
                  <input
                    type="text"
                    value={editingOfficial.phone}
                    onChange={e => setEditingOfficial({ ...editingOfficial, phone: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">البريد</label>
                  <input
                    type="email"
                    value={editingOfficial.email || ''}
                    onChange={e => setEditingOfficial({ ...editingOfficial, email: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">الوظيفة</label>
                  <input
                    type="text"
                    value={editingOfficial.jobTitle}
                    onChange={e => setEditingOfficial({ ...editingOfficial, jobTitle: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">الجهة</label>
                  <input
                    type="text"
                    value={editingOfficial.organization}
                    onChange={e => setEditingOfficial({ ...editingOfficial, organization: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">مستوى الصلاحية</label>
                <select
                  value={editingOfficial.permissionLevel}
                  onChange={e => setEditingOfficial({ ...editingOfficial, permissionLevel: e.target.value as any })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="admin">مدير نظام (Admin)</option>
                  <option value="executive">تنفيذي (Executive)</option>
                  <option value="supervisory">إشرافي (Supervisory)</option>
                  <option value="field">ميداني (Field)</option>
                  <option value="viewer">مشاهد (Viewer)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingOfficial(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleUpdateOfficial(editingOfficial)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
              >
                حفظ التعديل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      {showExcelModal && (
        <OfficialsExcelImportModal
          isOpen={showExcelModal}
          onClose={() => setShowExcelModal(false)}
          currentOfficials={officials}
          onImportCompleted={(updatedList, summary) => {
            setOfficials(updatedList);
            setImportStatusMsg({ type: 'success', text: summary });
            // Refresh logs
            setImportLogs(getAllImportLogs());
          }}
        />
      )}
    </div>
  );
}
