/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Initiative, UserRole } from '../types';
import { DISTRICTS_LIST, GOVERNORATES_LIST, DEFAULT_PATHWAYS_TEMPLATE } from '../data';
import { getAllStoredOfficials } from '../data/officialsRegistry';
import { Search, Plus, Filter, CheckCircle, AlertTriangle, HelpCircle, MapPin, Trash2, ShieldCheck, ClipboardCheck, Upload, FileSpreadsheet, Info, X, TrendingUp, Award, Compass, Layers, Flame, Activity, ChevronDown, SlidersHorizontal, HardHat, RotateCcw, UserCheck, Check, Sparkles } from 'lucide-react';
import ExecutiveInitiativeCard from './ExecutiveInitiativeCard';

const getRemainingAlertDetails = (init: Initiative) => {
  let cementRemaining = init.materialsRemaining;
  let dieselRemaining = init.dieselRemaining;

  const cementMat = init.materials?.find(m => 
    m.name.includes('أسمنت') || 
    m.name.toLowerCase().includes('cement') || 
    m.id.toLowerCase().includes('cement')
  );
  if (cementMat && cementMat.notes) {
    const notes = cementMat.notes;
    if (!cementRemaining) cementRemaining = notes.match(/متبقي:\s*([^|.]+)/)?.[1]?.trim();
  }

  const dieselMat = init.materials?.find(m => 
    m.name.includes('ديزل') || 
    m.name.toLowerCase().includes('diesel') || 
    m.id.toLowerCase().includes('diesel')
  );
  if (dieselMat && dieselMat.notes) {
    const notes = dieselMat.notes;
    if (!dieselRemaining) dieselRemaining = notes.match(/متبقي:\s*([^|.]+)/)?.[1]?.trim();
  }

  const hasCement = cementRemaining && cementRemaining !== '0' && cementRemaining !== '0 كيس' && !cementRemaining.includes('غير محدد') && cementRemaining.trim() !== '';
  const hasDiesel = dieselRemaining && dieselRemaining !== '0' && dieselRemaining !== '0 لتر' && !dieselRemaining.includes('غير محدد') && dieselRemaining.trim() !== '';

  return {
    hasCement,
    hasDiesel,
    cementAmount: cementRemaining,
    dieselAmount: dieselRemaining
  };
};

const renderMaterialsTooltipInfo = (init: Initiative) => {
  // Extract Cement values
  let cementApproved = init.materialsApproved;
  let cementDisbursed = init.materialsDisbursed;
  let cementRemaining = init.materialsRemaining;
  let cementUsed = init.materialsUsed;

  // Extract Diesel values
  let dieselApproved = init.dieselApproved;
  let dieselDisbursed = init.dieselDisbursed;
  let dieselRemaining = init.dieselRemaining;
  let dieselUsed = init.dieselUsed;

  // If these are empty, look into materials array
  const cementMat = init.materials?.find(m => 
    m.name.includes('أسمنت') || 
    m.name.toLowerCase().includes('cement') || 
    m.id.toLowerCase().includes('cement')
  );
  if (cementMat) {
    if (!cementApproved) cementApproved = `${cementMat.quantity} ${cementMat.unit || 'كيس'}`;
    if (cementMat.notes) {
      const notes = cementMat.notes;
      if (!cementDisbursed) cementDisbursed = notes.match(/منصرف:\s*([^|.]+)/)?.[1]?.trim();
      if (!cementRemaining) cementRemaining = notes.match(/متبقي:\s*([^|.]+)/)?.[1]?.trim();
      if (!cementUsed) cementUsed = notes.match(/مستخدم:\s*([^|.]+)/)?.[1]?.trim();
    }
  }

  const dieselMat = init.materials?.find(m => 
    m.name.includes('ديزل') || 
    m.name.toLowerCase().includes('diesel') || 
    m.id.toLowerCase().includes('diesel')
  );
  if (dieselMat) {
    if (!dieselApproved) dieselApproved = `${dieselMat.quantity} ${dieselMat.unit || 'لتر'}`;
    if (dieselMat.notes) {
      const notes = dieselMat.notes;
      if (!dieselDisbursed) dieselDisbursed = notes.match(/منصرف:\s*([^|.]+)/)?.[1]?.trim();
      if (!dieselRemaining) dieselRemaining = notes.match(/متبقي:\s*([^|.]+)/)?.[1]?.trim();
      if (!dieselUsed) dieselUsed = notes.match(/مستخدم:\s*([^|.]+)/)?.[1]?.trim();
    }
  }

  // Use clean fallbacks if still missing
  cementApproved = cementApproved || 'غير محدد';
  cementDisbursed = cementDisbursed || 'غير محدد';
  cementRemaining = cementRemaining || 'غير محدد';
  cementUsed = cementUsed || 'غير محدد';

  dieselApproved = dieselApproved || 'غير محدد';
  dieselDisbursed = dieselDisbursed || 'غير محدد';
  dieselRemaining = dieselRemaining || 'غير محدد';
  dieselUsed = dieselUsed || 'غير محدد';

  return (
    <div className="mt-2 pt-2 border-t border-slate-800 space-y-2 text-[10px] text-right">
      <div className="space-y-0.5">
        <span className="text-amber-400 font-extrabold block">🧱 كميات الإسمنت الميدانية:</span>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-slate-300 font-bold">
          <div>• المعتمد: <span className="text-white font-extrabold">{cementApproved}</span></div>
          <div>• المنصرف: <span className="text-blue-300 font-extrabold">{cementDisbursed}</span></div>
          <div>• المتبقي: <span className="text-rose-300 font-extrabold">{cementRemaining}</span></div>
          <div>• المستخدم: <span className="text-emerald-300 font-extrabold">{cementUsed}</span></div>
        </div>
      </div>
      
      <div className="space-y-0.5 pt-1.5 border-t border-slate-800/40">
        <span className="text-sky-400 font-extrabold block">⛽ كميات الديزل والمحروقات:</span>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-slate-300 font-bold">
          <div>• المعتمد: <span className="text-white font-extrabold">{dieselApproved}</span></div>
          <div>• المنصرف: <span className="text-blue-300 font-extrabold">{dieselDisbursed}</span></div>
          <div>• المتبقي: <span className="text-rose-300 font-extrabold">{dieselRemaining}</span></div>
          <div>• المستخدم: <span className="text-emerald-300 font-extrabold">{dieselUsed}</span></div>
        </div>
      </div>
    </div>
  );
};

interface InitiativesListProps {
  initiatives: Initiative[];
  onSelect: (initiative: Initiative) => void;
  onAdd: (newInit: Initiative) => void;
  onDelete: (id: string) => void;
  onImportAll?: (data: Initiative[]) => void;
  role?: UserRole | 'admin' | 'visitor';
  initialDistrictFilter?: string;
  onNavigateTab?: (tab: string, initiativeId?: string | null, pathwayId?: number) => void;
  onUpdateInitiative?: (updated: Initiative) => void;
}

export default function InitiativesList({ 
  initiatives, 
  onSelect, 
  onAdd, 
  onDelete, 
  onImportAll, 
  role = 'admin',
  initialDistrictFilter = 'all',
  onNavigateTab,
  onUpdateInitiative
}: InitiativesListProps) {
  // Filters & Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [initiativeNameFilter, setInitiativeNameFilter] = useState('');
  const [engineerFilter, setEngineerFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>(initialDistrictFilter);
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [completionFilter, setCompletionFilter] = useState<string>('all');
  const [interventionFilter, setInterventionFilter] = useState<string>('all');

  // List of all engineers & field knights gathered dynamically
  const engineersList = useMemo(() => {
    const set = new Set<string>();
    // From initiative committee & decisions
    initiatives.forEach(init => {
      init.committee?.forEach(c => {
        if (c.name && c.name !== '-' && c.name !== 'فارس تنموي ميداني') {
          set.add(c.name.trim());
        }
      });
      if (init.executiveDecision?.decisionMaker && (init.executiveDecision.decisionMaker.includes('م.') || init.executiveDecision.decisionMaker.includes('مهندس'))) {
        set.add(init.executiveDecision.decisionMaker.trim());
      }
    });

    // From Canonical Officials Registry
    try {
      const officials = getAllStoredOfficials();
      officials.forEach(o => {
        if (o.role?.includes('مهندس') || o.jobTitle?.includes('مهندس') || o.fullName?.startsWith('م.') || o.permissionLevel === 'field') {
          if (o.fullName) set.add(o.fullName.trim());
        }
      });
    } catch {
      // ignore
    }

    return Array.from(set).sort();
  }, [initiatives]);

  // Presentation View Mode: 'executive' (Horizontal Smart Cards) vs 'gallery' (Visual Gallery Portfolio)
  const [portfolioViewMode, setPortfolioViewMode] = useState<'executive' | 'gallery'>('executive');
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [isDataActionsOpen, setIsDataActionsOpen] = useState(false);

  const [hoveredInitiativeId, setHoveredInitiativeId] = useState<string | null>(null);
  const [openAlertInitiative, setOpenAlertInitiative] = useState<Initiative | null>(null);

  // Pagination state for ultra-fast rendering
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 24;

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim()) count++;
    if (initiativeNameFilter.trim()) count++;
    if (engineerFilter !== 'all') count++;
    if (statusFilter !== 'all') count++;
    if (districtFilter !== 'all') count++;
    if (ownerFilter !== 'all') count++;
    if (sectorFilter !== 'all') count++;
    if (priorityFilter !== 'all') count++;
    if (completionFilter !== 'all') count++;
    if (interventionFilter !== 'all') count++;
    return count;
  }, [searchTerm, initiativeNameFilter, engineerFilter, statusFilter, districtFilter, ownerFilter, sectorFilter, priorityFilter, completionFilter, interventionFilter]);

  // Reset all filters function
  const handleResetAllFilters = () => {
    setSearchTerm('');
    setInitiativeNameFilter('');
    setEngineerFilter('all');
    setStatusFilter('all');
    setDistrictFilter('all');
    setOwnerFilter('all');
    setSectorFilter('all');
    setPriorityFilter('all');
    setCompletionFilter('all');
    setInterventionFilter('all');
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, initiativeNameFilter, engineerFilter, statusFilter, districtFilter, ownerFilter, sectorFilter, priorityFilter, completionFilter, interventionFilter]);

  // Sync initialDistrictFilter when prop changes
  React.useEffect(() => {
    setDistrictFilter(initialDistrictFilter);
  }, [initialDistrictFilter]);

  // Form state for creating a new initiative
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDistrict, setNewDistrict] = useState(DISTRICTS_LIST[0]);
  const [newGovernorate, setNewGovernorate] = useState(GOVERNORATES_LIST[0]);
  const [newSubDistrict, setNewSubDistrict] = useState('');
  const [newVillage, setNewVillage] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newCommunityContribution, setNewCommunityContribution] = useState('');
  const [newUnitContribution, setNewUnitContribution] = useState('');
  const [newConfirmed, setNewConfirmed] = useState(true);

  // Import from file state
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [tempParsedData, setTempParsedData] = useState<Initiative[]>([]);
  const [gSheetUrl, setGSheetUrl] = useState('');
  const [isGSheetLoading, setIsGSheetLoading] = useState(false);

  // --- TEMPLATE DOWNLOAD HELPERS ---
  const handleDownloadCSVTemplate = () => {
    const csvContent = "\ufeffالاسم,المديرية,المحافظة,الحالة,الملكية_المجتمعية\n" +
      "مبادرة رصف طريق عقبة الشرف,السياني,إب,ongoing,نعم\n" +
      "مبادرة صيانة مجاري السيول بالقرية,جبلة,إب,completed,نعم\n" +
      "مبادرة عقبة ذي عسل السفلى,ذي السفال,إب,stagnant,لا";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'initiatives_template_ibb.csv');
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSONTemplate = () => {
    const jsonContent = JSON.stringify([
      {
        "name": "مبادرة رصف طريق عقبة الشرف",
        "district": "السياني",
        "governorate": "إب",
        "status": "ongoing",
        "ownerConfirmed": true
      },
      {
        "name": "مبادرة صيانة مجاري السيول بالقرية",
        "district": "جبلة",
        "governorate": "إب",
        "status": "completed",
        "ownerConfirmed": true
      }
    ], null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'initiatives_template_sufal.json');
    link.click();
    URL.revokeObjectURL(url);
  };

  // --- PARSE FILE HANDLER ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(null);
    setTempParsedData([]);

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.ods')) {
      reader.onload = (event) => {
        try {
          const buffer = event.target?.result as ArrayBuffer;
          const workbook = XLSX.read(buffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawData = XLSX.utils.sheet_to_json(worksheet) as any[];
          if (!rawData || rawData.length === 0) {
            throw new Error('لم يتم العثور على أي بيانات صالحة في ملف Excel.');
          }
          processParsedRows(rawData);
        } catch (err: any) {
          setImportError(`خطأ في قراءة ملف Excel: ${err.message || err}`);
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (file.name.endsWith('.json')) {
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const parsed = JSON.parse(text);
          if (!Array.isArray(parsed)) {
            throw new Error('يجب أن يحتوي ملف JSON على مصفوفة (Array) من المبادرات.');
          }
          processParsedRows(parsed);
        } catch (err: any) {
          setImportError(`خطأ في قراءة ملف JSON: ${err.message || err}`);
        }
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.csv') || file.name.endsWith('.tsv') || file.name.endsWith('.txt')) {
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const rows = parseCSVContent(text);
          if (rows.length === 0) {
            throw new Error('لم يتم العثور على أي بيانات صالحة في ملف CSV.');
          }
          processParsedRows(rows);
        } catch (err: any) {
          setImportError(`خطأ في قراءة ملف CSV: ${err.message || err}`);
        }
      };
      reader.readAsText(file, 'utf-8');
    } else {
      setImportError('صيغة الملف غير مدعومة! يرجى رفع ملف بصيغة Excel (.xlsx, .xls) أو .csv أو .json.');
    }
  };

  // Helper to convert Google Sheets Sharing Link to CSV export URL
  const convertGSheetUrlToCsv = (url: string): string => {
    let cleanUrl = url.trim();
    if (cleanUrl.includes('output=csv')) {
      return cleanUrl;
    }
    if (cleanUrl.includes('/pubhtml')) {
      return cleanUrl.replace('/pubhtml', '/pub?output=csv');
    }
    if (cleanUrl.includes('/pub')) {
      return cleanUrl.split('/pub')[0] + '/pub?output=csv';
    }
    const match = cleanUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
    }
    return cleanUrl;
  };

  // Direct Fetch from Google Sheets Link
  const handleGSheetFetch = async () => {
    if (!gSheetUrl) {
      setImportError('يرجى إدخال رابط ورقة عمل جوجل (Google Sheet) أولاً.');
      return;
    }
    setIsGSheetLoading(true);
    setImportError(null);
    setImportSuccess(null);
    setTempParsedData([]);
    try {
      const csvUrl = convertGSheetUrlToCsv(gSheetUrl);
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error('فشل جلب البيانات من الرابط. يرجى التأكد من أن ورقة العمل منشورة على الويب أو أن إعدادات المشاركة تتيح الوصول لـ "أي شخص لديه الرابط".');
      }
      const text = await response.text();
      const rows = parseCSVContent(text);
      if (rows.length === 0) {
        throw new Error('لم يتم العثور على أي بيانات صالحة في ملف الشيت.');
      }
      processParsedRows(rows);
    } catch (err: any) {
      setImportError(`خطأ في جلب شيت جوجل: ${err.message || err}`);
    } finally {
      setIsGSheetLoading(false);
    }
  };

  // Simple Quote-Aware CSV Parser
  const parseCSVContent = (text: string): Record<string, string>[] => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return [];

    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^"|"$/g, ''));
      return result;
    };

    const headers = parseCSVLine(lines[0]);
    const parsedRows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });
      parsedRows.push(row);
    }
    return parsedRows;
  };

  // Process rows into Initiative[]
  const processParsedRows = (rawRows: any[]) => {
    const initiativesList: Initiative[] = [];

    // Helper to translate Indic digits (e.g., ٥) to Western digits (e.g., 5)
    const translateIndicToWesternDigits = (str: string): string => {
      const indicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
      return str.replace(/[٠-٩]/g, (w) => {
        return String(indicDigits.indexOf(w));
      });
    };

    // Helper to robustly clean and parse any numeric string (removes commas, currency signs, spaces)
    const parseRobustNumber = (val: any): number => {
      if (val === undefined || val === null) return 0;
      let valStr = String(val).trim();
      if (!valStr) return 0;
      valStr = translateIndicToWesternDigits(valStr);
      const cleaned = valStr.replace(/[^0-9.]/g, '');
      const n = parseFloat(cleaned);
      return isNaN(n) ? 0 : n;
    };

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];

      // Robust key lookup function that checks row keys fuzzy-matching without spaces, underscores, and lowercase
      const findRowVal = (keys: string[], defaultVal: string = ''): string => {
        const rowKeys = Object.keys(row);
        // Clean target keys for comparison
        const cleanedKeys = keys.map(k => k.toLowerCase().replace(/[\s_-\u200b\t]/g, ''));
        
        // Exact match check first
        for (const k of keys) {
          if (row[k] !== undefined && row[k] !== null) return String(row[k]);
        }

        // Fuzzy search
        const matchedKey = rowKeys.find(rk => {
          const cleanedRk = rk.toLowerCase().replace(/[\s_-\u200b\t]/g, '');
          return cleanedKeys.some(ck => cleanedRk === ck || cleanedRk.includes(ck) || ck.includes(cleanedRk));
        });

        if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
          return String(row[matchedKey]);
        }
        return defaultVal;
      };

      let name = findRowVal([
        'name', 'title', 'الاسم', 'اسم المبادرة', 'اسم المبادره', 'اسم المشروع', 'اسم', 
        'المبادرة', 'المبادره', 'المشروع', 'اسم الطريق', 'بيان المبادرة', 'عنوان المبادرة', 
        'المبادرات', 'مشروع', 'الطريق', 'initiative_name', 'project_name', 'initiative', 'project'
      ]);

      if (!name) {
        const vals = Object.values(row);
        const candidate = vals.find(cell => {
          const s = String(cell || '').trim();
          return s.length >= 3 && /[\u0600-\u06FF]/.test(s) && !s.includes('مديرية') && !s.includes('محافظة') && !s.includes('إب');
        });
        name = candidate ? String(candidate).trim() : `مبادرة مستوردة رقم ${i + 1}`;
      }

      const rawDistrict = findRowVal(['district', 'المديرية', 'المديريه', 'مديرية', 'مديريه', 'المنطقة', 'القطاع'], 'ريف إب');
      let district = rawDistrict.trim();
      if (
        district.includes('ريف اب') || 
        district.includes('ريف إب') || 
        district.includes('ريف الآب') || 
        district.includes('ريف الأب') ||
        district.includes('ريف الـ اب') ||
        district.includes('ريف الـ إب')
      ) {
        district = 'مديرية ريف إب';
      } else if (district && !district.startsWith('مديرية')) {
        district = 'مديرية ' + district;
      }
      if (!district) {
        district = 'مديرية ريف إب';
      }
      const governorate = 'محافظة إب';
      let status = findRowVal(['status', 'الحالة', 'الحاله', 'حالة المبادرة', 'حالة العمل', 'حالة', 'حاله'], 'pending');
      const ownerConfirmedText = findRowVal(['ownerConfirmed', 'الملكية المجتمعية', 'الملكيه المجتمعيه', 'الملكية_المجتمعية', 'تم التأكيد', 'تم_التأكيد', 'مؤكد', 'مؤكدة', 'مؤكده'], 'نعم').trim();

      status = status.trim().toLowerCase();
      if (
        status.includes('مستمر') || 
        status.includes('جاري') || 
        status.includes('جارى') || 
        status.includes('قيد') || 
        status.includes('تحت العمل') || 
        status.includes('مستمرة') || 
        status.includes('ongoing') || 
        status.includes('active') || 
        status.includes('progress')
      ) {
        status = 'ongoing';
      } else if (
        status.includes('مكتمل') || 
        status.includes('منجز') || 
        status.includes('منجزة') || 
        status.includes('مكتملة') || 
        status.includes('تمت') || 
        status.includes('تم') || 
        status.includes('ناجحة') || 
        status.includes('منفذ') || 
        status.includes('منفذة') || 
        status.includes('تنفيذ') || 
        status.includes('complete') || 
        status.includes('done')
      ) {
        status = 'completed';
      } else if (status.includes('متعثر') || status.includes('stagnant')) {
        status = 'stagnant';
      } else if (status.includes('متوقف') || status.includes('stopped')) {
        status = 'stopped';
      } else {
        status = 'pending';
      }

      const ownerConfirmed = ownerConfirmedText === 'نعم' || ownerConfirmedText === 'true' || ownerConfirmedText === 'yes' || ownerConfirmedText === '1' || ownerConfirmedText === 'مؤكد' || ownerConfirmedText === 'مؤكدة' || ownerConfirmedText === 'مؤكده';

      const initiativeNumber = findRowVal(['initiativeNumber', 'رقم المبادرة', 'رقم المبادره', 'رقم_المبادرة', 'رقم', 'مسلسل', 'الرقم', 'م', 'id', 'number'], `IMP-${100 + i}`);
      const sector = findRowVal(['sector', 'القطاع', 'قطاع'], 'طرقات');
      const subDistrict = findRowVal(['subDistrict', 'العزلة', 'العزله', 'عزلة', 'عزله'], 'غير محدد');
      const village = findRowVal(['village', 'القرية', 'القريه', 'قرية', 'قريه', 'المحل'], 'غير محدد');
      const coordinates = findRowVal(['coordinates', 'الموقع الجغرافي', 'الموقع_الجغرافي', 'الإحداثيات', 'الاحداثيات', 'موقع', 'location', 'gps']);
      const startDate = findRowVal(['startDate', 'تاريخ البدء', 'تاريخ_البدء', 'البدء', 'تاريخ']);
      const endDate = findRowVal(['endDate', 'تاريخ الانتهاء', 'تاريخ_الانتهاء', 'الانتهاء']);
      
      const rawCostVal = findRowVal(['cost', 'التكلفة الإجمالية', 'التكلفه الإجماليه', 'التكلفة الكلية', 'التكلفه الكليه', 'اجمالي التكلفة', 'إجمالي التكلفة', 'تكلفة المبادرة', 'تكلفة المشروع', 'الموازنة', 'المبلغ', 'التكلفة', 'التكلفه', 'total_cost', 'totalcost', 'budget']);
      const rawCommunityVal = findRowVal(['communityContribution', 'مساهمة المجتمع', 'مسامه المجتمع', 'المساهمات المجتمعية', 'المساهمات المجتمعيه', 'مساهمات مجتمعية', 'مساهمة الأهالي', 'مسامه الاهالي', 'المساهمة المحلية', 'المجتمع', 'community_contribution', 'community', 'مساهمة المجتمع بالريال', 'مساهمةالمجتمع']);
      const rawUnitVal = findRowVal(['unitContribution', 'مساهمة وحدة التدخلات', 'مسامه وحده التدخلات', 'مساهمة الوحدة', 'مسامه الوحده', 'مساهمة_الوحدة', 'دعم الوحدة', 'دعم وحدة التدخلات', 'مساهمة التدخلات', 'unit_contribution', 'government', 'مساهمة وحدة التدخلات بالريال', 'مساهمةالوحدة']);
      const rawRateVal = findRowVal(['completionRate', 'نسبة الإنجاز', 'نسبة الانجاز', 'نسبه الانجاز', 'الإنجاز', 'الانجاز', 'percentage', 'completion_rate', 'progress']);

      const communityContribution = parseRobustNumber(rawCommunityVal);
      const unitContribution = parseRobustNumber(rawUnitVal);
      const cost = parseRobustNumber(rawCostVal) || (communityContribution + unitContribution);
      const completionRate = parseRobustNumber(rawRateVal);

      const newInit: Initiative = {
        id: `init_imp_${Date.now()}_${i}_${String(i).padStart(4, '0')}`,
        initiativeNumber,
        name: name.trim(),
        sector,
        subDistrict,
        village,
        coordinates,
        startDate,
        endDate,
        cost,
        communityContribution,
        unitContribution,
        completionRate,
        district: district.trim(),
        governorate: governorate.trim(),
        status: status as any,
        ownerConfirmed,
        createdAt: new Date().toISOString().split('T')[0],
        pathways: JSON.parse(JSON.stringify(DEFAULT_PATHWAYS_TEMPLATE)),
        contributions: communityContribution > 0 ? [
          {
            id: `contrib_${Date.now()}_${i}`,
            donorName: 'مساهمة المجتمع المعتمدة التأسيسية',
            type: 'cash',
            description: 'رصيد المساهمة التأسيسية للمجتمع الموثقة في دراسة الجدوى للمبادرة',
            value: communityContribution,
            date: new Date().toISOString().split('T')[0]
          }
        ] : [],
        materials: unitContribution > 0 ? [
          {
            id: `mat_f_${Date.now()}_${i}`,
            name: 'المواد والدعم اللوجستي المقدم من وحدة التدخلات',
            quantity: 1,
            unit: 'دعم عيني متكامل',
            status: 'safe',
            storageLocation: 'مخازن المبادرة الميدانية المعتمدة',
            updatedAt: new Date().toISOString().split('T')[0],
            notes: 'دعم معتمد مساهمة من وحدة التدخلات المركزية'
          }
        ] : [],
        committee: [
          {
            id: `com_imp_${Date.now()}_${i}`,
            name: 'فارس تنموي ميداني',
            role: 'knight',
            phone: '-',
            tasksAssigned: 4
          }
        ],
        reports: []
      };

      initiativesList.push(newInit);
    }

    if (initiativesList.length === 0) {
      setImportError('لم يتم العثور على أي سجلات صالحة تحتوي على اسم المبادرة في الملف.');
    } else {
      setTempParsedData(initiativesList);
      setImportSuccess(`تم قراءة الملف بنجاح! تم العثور على (${initiativesList.length}) مبادرة جاهزة للاستيراد.`);
    }
  };

  // Perform actual database import
  const executeImport = (merge: boolean) => {
    if (!onImportAll) {
      setImportError('منصة الاستيراد المباشر غير مفعلة حالياً في التطبيق الرئيسي.');
      return;
    }

    let finalData: Initiative[] = [];
    if (merge) {
      finalData = [...tempParsedData, ...initiatives];
    } else {
      finalData = tempParsedData;
    }

    onImportAll(finalData);
    setImportSuccess(`🎉 تم استيراد (${tempParsedData.length}) مبادرة بنجاح وحفظها في قاعدة البيانات المحلية!`);
    setTempParsedData([]);
    setTimeout(() => {
      setIsImporting(false);
      setImportSuccess(null);
    }, 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const parsedCost = Number(newCost) || 0;
    const parsedCommunity = Number(newCommunityContribution) || 0;
    const parsedUnit = Number(newUnitContribution) || 0;

    const newInit: Initiative = {
      id: `init_${Date.now()}`,
      initiativeNumber: `INIT-${100 + initiatives.length + 1}`,
      name: newName.trim(),
      sector: 'طرقات',
      subDistrict: newSubDistrict.trim() || 'غير محدد',
      village: newVillage.trim() || 'غير محدد',
      coordinates: '',
      startDate: '',
      endDate: '',
      cost: parsedCost || (parsedCommunity + parsedUnit),
      communityContribution: parsedCommunity,
      unitContribution: parsedUnit,
      completionRate: 0,
      district: newDistrict,
      governorate: newGovernorate,
      status: 'pending',
      ownerConfirmed: newConfirmed,
      createdAt: new Date().toISOString().split('T')[0],
      pathways: JSON.parse(JSON.stringify(DEFAULT_PATHWAYS_TEMPLATE)), // fresh deep copy
      contributions: parsedCommunity > 0 ? [
        {
          id: `contrib_${Date.now()}`,
          donorName: 'مساهمة المجتمع المعتمدة التأسيسية',
          type: 'cash',
          description: 'رصيد المساهمة التأسيسية للمجتمع الموثقة في دراسة الجدوى للمبادرة',
          value: parsedCommunity,
          date: new Date().toISOString().split('T')[0]
        }
      ] : [],
      materials: parsedUnit > 0 ? [
        {
          id: `mat_f_${Date.now()}`,
          name: 'المواد والدعم اللوجستي المقدم من وحدة التدخلات',
          quantity: 1,
          unit: 'دعم عيني متكامل',
          status: 'safe',
          storageLocation: 'مخازن المبادرة الميدانية المعتمدة',
          updatedAt: new Date().toISOString().split('T')[0],
          notes: 'دعم معتمد مساهمة من وحدة التدخلات المركزية'
        }
      ] : [],
      committee: [
        {
          id: `com_f_${Date.now()}`,
          name: 'فارس تنموي افتراضي',
          role: 'knight',
          phone: '-',
          tasksAssigned: 4
        }
      ],
      reports: []
    };

    onAdd(newInit);
    setNewName('');
    setNewSubDistrict('');
    setNewVillage('');
    setNewCost('');
    setNewCommunityContribution('');
    setNewUnitContribution('');
    setIsAdding(false);
  };

  // Filter computation memoized for high performance
  const filteredInitiatives = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const nameTerm = initiativeNameFilter.trim().toLowerCase();
    const engTerm = engineerFilter !== 'all' ? engineerFilter.trim().toLowerCase() : '';

    return initiatives.filter(init => {
      // 1. Universal Search (Term)
      const matchesSearch = !term ||
                            init.name.toLowerCase().includes(term) ||
                            (init.initiativeNumber && init.initiativeNumber.toLowerCase().includes(term)) ||
                            init.district.toLowerCase().includes(term) ||
                            init.governorate.toLowerCase().includes(term) ||
                            (init.subDistrict && init.subDistrict.toLowerCase().includes(term)) ||
                            (init.village && init.village.toLowerCase().includes(term)) ||
                            (init.committee && init.committee.some(c => c.name.toLowerCase().includes(term))) ||
                            (init.executiveDecision?.decisionMaker && init.executiveDecision.decisionMaker.toLowerCase().includes(term)) ||
                            (init.notes && init.notes.toLowerCase().includes(term));
      
      // 2. Explicit Initiative Name Filter
      const matchesName = !nameTerm || 
                          init.name.toLowerCase().includes(nameTerm) ||
                          (init.initiativeNumber && init.initiativeNumber.toLowerCase().includes(nameTerm));

      // 3. Status filter
      const matchesStatus = statusFilter === 'all' ? true : init.status === statusFilter;

      // 4. District filter
      const matchesDistrict = districtFilter === 'all' ? true : init.district === districtFilter;

      // 5. Engineer & Field Knight Filter
      let matchesEngineer = true;
      if (engTerm) {
        const inCommittee = init.committee?.some(c => c.name.toLowerCase().includes(engTerm));
        const inDecisionMaker = init.executiveDecision?.decisionMaker?.toLowerCase().includes(engTerm);
        const inNotes = init.notes?.toLowerCase().includes(engTerm);
        matchesEngineer = Boolean(inCommittee || inDecisionMaker || inNotes);
      }
      
      let matchesOwner = true;
      if (ownerFilter === 'confirmed') matchesOwner = init.ownerConfirmed;
      if (ownerFilter === 'unconfirmed') matchesOwner = !init.ownerConfirmed;

      const matchesSector = sectorFilter === 'all' ? true : (init.sector || 'طرقات') === sectorFilter;

      let matchesPriority = true;
      if (priorityFilter === 'high') matchesPriority = init.status === 'stagnant' || (init.completionRate < 35 && init.cost > 10000000);
      if (priorityFilter === 'medium') matchesPriority = init.status === 'ongoing' && init.completionRate < 60;
      if (priorityFilter === 'normal') matchesPriority = init.status === 'completed' || init.completionRate >= 60;

      let matchesCompletion = true;
      if (completionFilter === 'high') matchesCompletion = init.completionRate >= 70;
      if (completionFilter === 'medium') matchesCompletion = init.completionRate >= 30 && init.completionRate < 70;
      if (completionFilter === 'low') matchesCompletion = init.completionRate < 30;

      let matchesIntervention = true;
      if (interventionFilter === 'needed') {
        matchesIntervention = init.status === 'stagnant' || !init.ownerConfirmed || init.materials?.some(m => m.status === 'at_risk');
      }

      return matchesSearch && matchesName && matchesStatus && matchesDistrict && matchesEngineer && matchesOwner && matchesSector && matchesPriority && matchesCompletion && matchesIntervention;
    });
  }, [initiatives, searchTerm, initiativeNameFilter, engineerFilter, statusFilter, districtFilter, ownerFilter, sectorFilter, priorityFilter, completionFilter, interventionFilter]);

  const totalPages = Math.ceil(filteredInitiatives.length / ITEMS_PER_PAGE) || 1;

  const paginatedInitiatives = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInitiatives.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInitiatives, currentPage]);

  const getStatusBadge = (status: Initiative['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            منجز
          </span>
        );
      case 'ongoing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
            قيد التنفيذ
          </span>
        );
      case 'stagnant':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce"></span>
            متعثر
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100" title="مبادرة معتمدة بمصفوفة وحدة التدخلات ولكن لم تبدأ العمل ولم يتم صرف مساهمة الوحدة لعدم تفاعل المجتمع">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            لم يبدأ ⏳
          </span>
        );
      case 'stopped':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
            متوقف
          </span>
        );
    }
  };

  return (
    <div className="space-y-6" dir="rtl" id="initiatives-list-container">
      {/* Action Header & Filters bar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">سجل المبادرات المجتمعية النشطة بالمديريات</h2>
            <p className="text-sm text-slate-500">ابحث وتابع المبادرات التعاونية الجاري تنفيذها وتدقيقها بالنتائج</p>
          </div>

          {role !== 'visitor' && (
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Secondary Data Actions Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDataActionsOpen(!isDataActionsOpen)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold text-xs transition-all duration-200 cursor-pointer border border-slate-200 shadow-3xs"
                  id="btn-data-actions-menu"
                >
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                  <span>إجراءات البيانات والاستيراد ⚙️</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDataActionsOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDataActionsOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsDataActionsOpen(false)}></div>
                    <div className="absolute left-0 lg:right-0 lg:left-auto mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-40 space-y-1 animate-fadeIn text-right">
                      <div className="px-3 py-1.5 text-[11px] font-black text-slate-400 border-b border-slate-100 mb-1">
                        خيارات استيراد وإدارة قاعدة البيانات
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsDataActionsOpen(false);
                          setIsImporting(!isImporting);
                          setIsAdding(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-right hover:bg-indigo-50 text-slate-800 hover:text-indigo-900 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>استيراد المبادرات من ملف أو رابط جوجل 📂</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsDataActionsOpen(false);
                          handleDownloadCSVTemplate();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-right hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>تحميل قالب Excel الاسترشادي (CSV) 📥</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsDataActionsOpen(false);
                          handleDownloadJSONTemplate();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-right hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-slate-600 shrink-0" />
                        <span>تحميل قالب JSON الاسترشادي 📥</span>
                      </button>

                      <div className="border-t border-slate-100 pt-1 mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsDataActionsOpen(false);
                            if (confirm('تنبيه هام! هل أنت متأكد من رغبتك في حذف وإفراغ كافة المشاريع والمبادرات الحالية من المنصة للبدء من جديد؟ لا يمكن التراجع عن هذا الإجراء.')) {
                              onImportAll?.([]);
                            }
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-right hover:bg-rose-50 text-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          id="btn-clear-all"
                        >
                          <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>مسح وتفريغ السجل بالكامل 🗑️</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Primary Action Button */}
              <button
                type="button"
                onClick={() => {
                  setIsAdding(!isAdding);
                  setIsImporting(false);
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all duration-200 cursor-pointer"
                id="btn-add-initiative"
              >
                <Plus className="w-4 h-4" />
                <span>تسجيل مبادرة مجتمعية جديدة</span>
              </button>
            </div>
          )}
        </div>

        {/* Import Initiative File Block */}
        {isImporting && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-5 space-y-4 animate-fadeIn" id="block-import-initiatives">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <span>استيراد المبادرات من ملف خارجي (CSV / JSON)</span>
              </div>
              <button onClick={() => setIsImporting(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Column 1: Instructions */}
              <div className="lg:col-span-1 space-y-3 bg-white border border-slate-200 p-4 rounded-xl text-xs text-slate-700 leading-relaxed flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 mb-2 text-indigo-700">
                    <Info className="w-4 h-4 shrink-0 text-indigo-600" />
                    تعليمات إدخال المبادرات من ملف أو شيت:
                  </h4>
                  <p className="text-[11px] text-slate-600 mb-2">
                    يمكنك استيراد قائمة المبادرات دفعة واحدة. يدعم النظام صيغ <strong>CSV</strong> و <strong>JSON</strong> وأيضاً <strong>رابط Google Sheets المباشر</strong>.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-500 pr-1 text-[10.5px]">
                    <li><strong>اسم المبادرة:</strong> يجب توفر عمود باسم <code>الاسم</code> أو <code>name</code>.</li>
                    <li><strong>العزلة والقرية:</strong> أعمدة اختيارية: <code>العزلة</code>، <code>القرية</code> لربط المواقع الجغرافية.</li>
                    <li><strong>الحالة:</strong> يدعم: <code>مستمر</code> (ongoing)، <code>مكتمل</code> (completed)، <code>متعثر</code> (stagnant).</li>
                  </ul>
                </div>
                <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleDownloadCSVTemplate}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg font-bold border border-slate-200 transition-colors cursor-pointer text-[10px]"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    تحميل قالب CSV (إكسل) الاسترشادي 📥
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadJSONTemplate}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg font-bold border border-slate-200 transition-colors cursor-pointer text-[10px]"
                  >
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    تحميل قالب JSON الاسترشادي 📥
                  </button>
                </div>
              </div>

              {/* Column 2: Upload Area */}
              <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-800">الخيار الأول: تصفح أو إسقاط ملف (.csv أو .json):</label>
                  <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-lg p-5 text-center cursor-pointer transition-all relative">
                    <input
                      type="file"
                      accept=".csv,.json"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-7 h-7 text-indigo-400 mx-auto mb-2 animate-pulse" />
                    <span className="text-xs font-bold text-slate-600 block">اضغط لتصفح الملفات</span>
                    <span className="text-[9.5px] text-slate-400 mt-1 block">أو اسحب ملفك هنا</span>
                  </div>
                </div>

                {importError && (
                  <div className="bg-rose-50 border border-rose-100 p-2.5 rounded-lg text-[10.5px] font-semibold text-rose-850 leading-relaxed flex items-start gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600 mt-0.5" />
                    <span>{importError}</span>
                  </div>
                )}

                {importSuccess && (
                  <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg text-[10.5px] font-semibold text-emerald-850 leading-relaxed flex items-start gap-1">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-600 mt-0.5" />
                    <span>{importSuccess}</span>
                  </div>
                )}
              </div>

              {/* Column 3: Google Sheets Direct Sync Link */}
              <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-800 flex items-center gap-1">
                    <span className="text-emerald-600">🌐</span>
                    <span>الخيار الثاني: استيراد ومزامنة من رابط جوجل شيت:</span>
                  </label>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    الصق رابط ملف Google Sheets هنا. تأكد من أن الملف مشارك بـ <strong>"أي شخص لديه الرابط يمكنه العرض"</strong> أو منشور على الويب ليتمكن النظام من قراءته.
                  </p>
                  <div className="relative mt-1">
                    <input
                      type="url"
                      value={gSheetUrl}
                      onChange={(e) => setGSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="w-full text-[10px] p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white text-left font-mono"
                      dir="ltr"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGSheetFetch}
                  disabled={isGSheetLoading}
                  className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    isGSheetLoading
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 shadow-3xs'
                  }`}
                >
                  {isGSheetLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <span>جاري جلب وقراءة الشيت...</span>
                    </>
                  ) : (
                    <>
                      <span>تحميل ومزامنة المبادرات ⚡</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Actions Bar for Import execution */}
            {tempParsedData.length > 0 && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn">
                <div className="text-xs text-indigo-900 space-y-0.5">
                  <strong className="block font-black text-sm text-indigo-950"> جاهز للاستيراد الآن!</strong>
                  <span>لديك ({tempParsedData.length}) مبادرات مقروءة بشكل صحيح. اختر كيفية الحفظ بالمنظومة:</span>
                </div>
                <div className="flex flex-wrap gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => executeImport(true)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
                  >
                    إضافة المبادرات للبيانات الحالية ➕
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('تنبيه هام! هذا الخيار سيقوم بمسح كافة المبادرات المعروضة حالياً بالمنصة واستبدالها بالكامل بملفك الجديد. هل ترغب بالاستمرار؟')) {
                        executeImport(false);
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
                  >
                    استبدال ومسح البيانات القديمة 🔄
                  </button>
                  <button
                    onClick={() => {
                      setTempParsedData([]);
                      setImportSuccess(null);
                    }}
                    className="px-3 py-2 border border-slate-200 text-slate-600 text-xs rounded-lg hover:bg-white cursor-pointer"
                  >
                    إلغاء الملف
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Initiative Form Block */}
        {isAdding && (
          <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200/60 rounded-xl p-5 mb-5 space-y-4 animate-fadeIn" id="form-add-initiative">
            <h3 className="font-bold text-slate-900 text-base">تسجيل بيانات مبادرة جديدة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">اسم المبادرة بالتفصيل 🏔️</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مبادرة رصف طريق عقبة الشرف"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">المديرية</label>
                <select
                  value={newDistrict}
                  onChange={(e) => setNewDistrict(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  {DISTRICTS_LIST.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">المحافظة</label>
                <select
                  value={newGovernorate}
                  onChange={(e) => setNewGovernorate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  {GOVERNORATES_LIST.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">العزلة</label>
                <input
                  type="text"
                  placeholder="مثال: بلاد الجبل"
                  value={newSubDistrict}
                  onChange={(e) => setNewSubDistrict(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">القرية / المحل</label>
                <input
                  type="text"
                  placeholder="مثال: قرية الشرف"
                  value={newVillage}
                  onChange={(e) => setNewVillage(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">التكلفة الكلية التقديرية حسب الدراسة (ريال يمني)</label>
                <input
                  type="number"
                  placeholder="إذا تركت فارغة سيتم احتسابها تلقائياً من مجموع المساهمتين"
                  value={newCost}
                  onChange={(e) => setNewCost(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 font-mono text-left"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 text-emerald-700">✊ مساهمة المجتمع الذاتية المعتمدة (ريال يمني)</label>
                <input
                  type="number"
                  placeholder="مثال: 5000000"
                  value={newCommunityContribution}
                  onChange={(e) => setNewCommunityContribution(e.target.value)}
                  className="w-full bg-white border border-emerald-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 font-mono text-left"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 text-indigo-700">🏛️ مساهمة وحدة التدخلات المركزية المعتمدة (ريال يمني)</label>
                <input
                  type="number"
                  placeholder="مثال: 4000000"
                  value={newUnitContribution}
                  onChange={(e) => setNewUnitContribution(e.target.value)}
                  className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 font-mono text-left"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newConfirmed}
                  onChange={(e) => setNewConfirmed(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-sm font-semibold text-slate-700">إثبات ملكية المجتمع للمبادرة وحماية مخازن المواد</span>
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 text-sm hover:bg-slate-100 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition-colors"
                >
                  حفظ وتسجيل المبادرة
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Presentation View Mode Switcher Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-600" />
              طريقة عرض محفظة المبادرات (مركز التحكم والقيادة التنموية):
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              اختر بين نمط العرض التنفيذي ذي البطاقات الأفقية الذكية، أو المعرض البصري التنموي
            </p>
          </div>

          {/* View Mode Switcher Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
            <button
              onClick={() => setPortfolioViewMode('executive')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                portfolioViewMode === 'executive'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>📋 العرض التنفيذي (بطاقات أفقية)</span>
              <span className="text-[9px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded font-black">موصى به</span>
            </button>
            <button
              onClick={() => setPortfolioViewMode('gallery')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                portfolioViewMode === 'gallery'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>🖼️ العرض البصري (معرض محفظة التنمية)</span>
            </button>
          </div>
        </div>

        {/* Primary Search & Multi-Filter Control Hub (Responsive & Mobile-Optimized) */}
        <div className="pt-3 space-y-3" id="filters-container">
          {/* Main Search Bar & Quick Stats */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 right-3 flex items-center text-slate-400 pointer-events-none">
                <Search className="w-4 h-4 text-indigo-600" />
              </span>
              <input
                type="text"
                placeholder="بحث عام: اكتب اسم المبادرة، الرمز، العزلة، القرية، المهندس، أو رقم المشروع..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl pr-9 pl-9 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 left-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="مسح البحث"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Results Count & Reset Button */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="px-3 py-2 bg-indigo-50/80 border border-indigo-100 text-indigo-950 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>النتائج:</span>
                <span className="font-extrabold text-indigo-700 bg-white px-1.5 py-0.5 rounded-md shadow-3xs">{filteredInitiatives.length}</span>
                <span className="text-[10px] text-indigo-500">/ {initiatives.length}</span>
              </div>

              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetAllFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-3xs"
                  title="إلغاء وتفريغ كافة الفلاتر النشطة"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">إعادة ضبط ({activeFiltersCount})</span>
                </button>
              )}
            </div>
          </div>

          {/* 4 Core Multi-Filters: (اسم المبادرة، اسم المهندس، الحالة، المديرية) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Filter 1: اسم المبادرة / الكود */}
            <div className="relative flex items-center bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3 py-1.5 transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:bg-white">
              <Compass className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-2" />
              <input
                type="text"
                placeholder="اسم المبادرة / الكود..."
                value={initiativeNameFilter}
                onChange={(e) => setInitiativeNameFilter(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-800 font-semibold focus:outline-none placeholder:text-slate-400"
              />
              {initiativeNameFilter && (
                <button
                  type="button"
                  onClick={() => setInitiativeNameFilter('')}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer pr-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter 2: اسم المهندس / فارس التنمية */}
            <div className="flex items-center gap-2 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3 py-1.5 transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:bg-white">
              <HardHat className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <select
                value={engineerFilter}
                onChange={(e) => setEngineerFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none w-full cursor-pointer truncate"
              >
                <option value="all">👷‍♂️ كافة المهندسين والفرسان</option>
                {engineersList.map(eng => (
                  <option key={eng} value={eng}>{eng}</option>
                ))}
              </select>
            </div>

            {/* Filter 3: الحالة التنفيذية */}
            <div className="flex items-center gap-2 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3 py-1.5 transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:bg-white">
              <Filter className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none w-full cursor-pointer"
              >
                <option value="all">📊 كل حالات التنفيذ</option>
                <option value="completed">منجز ✓</option>
                <option value="ongoing">قيد التنفيذ 🚧</option>
                <option value="stagnant">متعثر ⚠️</option>
                <option value="stopped">متوقف 🛑</option>
                <option value="pending">لم يبدأ ⏳</option>
              </select>
            </div>

            {/* Filter 4: المديرية */}
            <div className="flex items-center gap-2 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3 py-1.5 transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:bg-white">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none w-full cursor-pointer truncate"
              >
                <option value="all">🏢 كل المديريات (٢٠ مديرية)</option>
                {Array.from(new Set([...DISTRICTS_LIST, ...initiatives.map(init => init.district).filter(Boolean)])).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Filter Status Pills + Advanced Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            {/* Quick Status Chips */}
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-bold">
              <span className="text-slate-400 text-[10.5px] ml-1">تصفية سريعة:</span>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-3xs font-extrabold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                الكل
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  statusFilter === 'completed'
                    ? 'bg-emerald-700 text-white shadow-3xs font-extrabold'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                منجز
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ongoing')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  statusFilter === 'ongoing'
                    ? 'bg-indigo-700 text-white shadow-3xs font-extrabold'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                قيد التنفيذ
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('stagnant')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  statusFilter === 'stagnant'
                    ? 'bg-amber-700 text-white shadow-3xs font-extrabold'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                متعثر
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('stopped')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  statusFilter === 'stopped'
                    ? 'bg-rose-700 text-white shadow-3xs font-extrabold'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                متوقف
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  statusFilter === 'pending'
                    ? 'bg-slate-700 text-white shadow-3xs font-extrabold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                لم يبدأ
              </button>
              <button
                type="button"
                onClick={() => setInterventionFilter(interventionFilter === 'needed' ? 'all' : 'needed')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  interventionFilter === 'needed'
                    ? 'bg-orange-600 text-white shadow-3xs font-extrabold'
                    : 'bg-orange-50 text-orange-800 hover:bg-orange-100'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                تدخل عاجل
              </button>
            </div>

            {/* Advanced Extra Filters Button */}
            <button
              type="button"
              onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                isAdvancedFiltersOpen || [sectorFilter, priorityFilter, completionFilter, ownerFilter].some(f => f !== 'all')
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-3xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
              <span>فلاتر قطاعية إضافية</span>
              {[sectorFilter, priorityFilter, completionFilter, ownerFilter].filter(f => f !== 'all').length > 0 && (
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center">
                  {[sectorFilter, priorityFilter, completionFilter, ownerFilter].filter(f => f !== 'all').length}
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isAdvancedFiltersOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Filters Section */}
        {isAdvancedFiltersOpen && (
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 animate-fadeIn bg-slate-50/60 p-3 rounded-xl">
            {/* Sector / Intervention Filter */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-3xs">
              <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none w-full cursor-pointer"
              >
                <option value="all">كل القطاعات</option>
                <option value="طرقات">🛣️ قطاع الطرق والرصف</option>
                <option value="مياه">مياه وسدود</option>
                <option value="تعليم">تعليم ومدارس</option>
                <option value="صحة">صحة ومراكز صحية</option>
                <option value="زراعة">زراعة وقنوات استصلاح</option>
              </select>
            </div>

            {/* Priority Level Filter */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-3xs">
              <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none w-full cursor-pointer"
              >
                <option value="all">كل مستويات الأولوية</option>
                <option value="high">🔴 عاجل جداً (يحتاج تدخل)</option>
                <option value="medium">🟠 أولوية متوسطة (قيد المتابعة)</option>
                <option value="normal">🟢 أولوية اعتيادية (مستقرة)</option>
              </select>
            </div>

            {/* Completion Rate Filter */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-3xs">
              <Activity className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={completionFilter}
                onChange={(e) => setCompletionFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none w-full cursor-pointer"
              >
                <option value="all">نسب الإنجاز (الكل)</option>
                <option value="high">أكثر من ٧٠٪ إنجاز</option>
                <option value="medium">من ٣٠٪ إلى ٧٠٪ إنجاز</option>
                <option value="low">أقل من ٣٠٪ إنجاز</option>
              </select>
            </div>

            {/* Intervention Need Filter */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-3xs">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <select
                value={interventionFilter}
                onChange={(e) => setInterventionFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none w-full cursor-pointer"
              >
                <option value="all">الحاجة للتدخل القيادي (الكل)</option>
                <option value="needed">⚠️ تتطلب تدخلاً عاجلاً</option>
              </select>
            </div>

            {/* Verification Status Filter */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-3xs">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none w-full cursor-pointer"
              >
                <option value="all">إثبات الملكية (الكل)</option>
                <option value="confirmed">ملكية مثبتة ومضمونة</option>
                <option value="unconfirmed">بانتظار التحقق والإثبات</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Pagination Bar Top */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 my-3 text-xs shadow-3xs">
          <div className="text-slate-700 font-bold">
            عرض الصفحة <span className="text-indigo-600 font-extrabold">{currentPage}</span> من أصل <span className="text-slate-900 font-extrabold">{totalPages}</span> (إجمالي {filteredInitiatives.length} مبادرة)
          </div>
          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-40 font-bold rounded-lg transition-colors cursor-pointer text-xs"
            >
              السابقة ◀
            </button>
            <div className="flex gap-1 text-[11px] font-extrabold">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5) {
                  if (currentPage > 3 && currentPage < totalPages - 1) {
                    pageNum = currentPage - 2 + i;
                  } else if (currentPage >= totalPages - 1) {
                    pageNum = totalPages - 4 + i;
                  }
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-40 font-bold rounded-lg transition-colors cursor-pointer text-xs"
            >
              التالية ▶
            </button>
          </div>
        </div>
      )}

      {/* Display Grid / List based on portfolioViewMode */}
      <div id="initiatives-portfolio-container">
        {paginatedInitiatives.length > 0 ? (
          portfolioViewMode === 'executive' ? (
            /* EXECUTIVE VIEW: Smart Horizontal Cards */
            <div className="grid grid-cols-1 gap-6" id="initiatives-executive-list">
              {paginatedInitiatives.map((init) => (
                <ExecutiveInitiativeCard
                  key={init.id}
                  initiative={init}
                  onSelect={onSelect}
                  onDelete={onDelete}
                  onNavigateTab={onNavigateTab}
                  onUpdateInitiative={onUpdateInitiative}
                  role={role}
                />
              ))}
            </div>
          ) : (
            /* VISUAL GALLERY VIEW: Portfolio Cards */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="initiatives-gallery-list">
              {paginatedInitiatives.map((init) => {
                const totalTasksCount = init.pathways.reduce((sum, p) => sum + p.tasks.length, 0);
                const completedTasksCount = init.pathways.reduce((sum, p) => sum + p.tasks.filter(t => t.completed).length, 0);
                const progressRatio = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
                const beneficiariesCount = Math.round((init.cost || 5000000) / 2500);

                return (
                  <div
                    key={init.id}
                    className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                    id={`gallery-card-${init.id}`}
                  >
                    <div>
                      {/* Visual Banner Header */}
                      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-5 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                        <div className="flex items-center justify-between gap-2 mb-2 relative z-10">
                          <span className="text-[10px] font-extrabold bg-emerald-500/30 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-400/30">
                            {init.sector || 'قطاع الطرق والمواصلات'}
                          </span>
                          {getStatusBadge(init.status)}
                        </div>
                        <h3 className="font-bold text-white text-base leading-snug line-clamp-2 mt-1 relative z-10 group-hover:text-emerald-300 transition-colors">
                          {init.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-slate-300 text-xs mt-2 relative z-10 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                          <span>مديرية {init.district} ، محافظة {init.governorate}</span>
                        </div>
                      </div>

                      {/* Content Details */}
                      <div className="p-5 space-y-4">
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          مبادرة تنموية مجتمعية قائمة على تظافر الجهود المحلية ودعم وحدة التدخلات لتطوير البنية التحتية الخدمية بالمديرية.
                        </p>

                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold">عدد المستفيدين:</span>
                            <span className="font-extrabold text-slate-800">{beneficiariesCount.toLocaleString()} نسمة</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold">مؤشر الأثر التنموي:</span>
                            <span className="font-extrabold text-emerald-700">ممتاز (٩.٢ / ١٠)</span>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-slate-600">نسبة الإنجاز الميداني:</span>
                            <span className="text-emerald-700 font-extrabold">{init.completionRate}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${init.completionRate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Button */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100">
                      <button
                        onClick={() => onSelect(init)}
                        className="w-full py-2.5 px-4 bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <ClipboardCheck className="w-4 h-4" />
                        <span>عرض الملف التنفيذي للمبادرة</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 bg-white rounded-2xl border border-slate-100 text-slate-500" id="empty-initiatives">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-800 mb-1">لم يتم العثور على أي مبادرة مطابقة للفلاتر</h4>
            <p className="text-sm">قم بتعديل البحث أو اضغط على زر "تسجيل مبادرة جديدة" للبدء بالتوثيق.</p>
          </div>
        )}
      </div>

      {/* Pagination Bar Bottom */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between bg-white border border-slate-200/80 rounded-xl px-4 py-3 my-4 text-xs shadow-3xs">
          <div className="text-slate-700 font-bold">
            عرض الصفحة <span className="text-indigo-600 font-extrabold">{currentPage}</span> من أصل <span className="text-slate-900 font-extrabold">{totalPages}</span> (إجمالي {filteredInitiatives.length} مبادرة)
          </div>
          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => {
                setCurrentPage(p => Math.max(1, p - 1));
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }}
              className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-40 font-bold rounded-lg transition-colors cursor-pointer text-xs"
            >
              السابقة ◀
            </button>
            <div className="flex gap-1 text-[11px] font-extrabold">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5) {
                  if (currentPage > 3 && currentPage < totalPages - 1) {
                    pageNum = currentPage - 2 + i;
                  } else if (currentPage >= totalPages - 1) {
                    pageNum = totalPages - 4 + i;
                  }
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => {
                      setCurrentPage(pageNum);
                      window.scrollTo({ top: 300, behavior: 'smooth' });
                    }}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => {
                setCurrentPage(p => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }}
              className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-40 font-bold rounded-lg transition-colors cursor-pointer text-xs"
            >
              التالية ▶
            </button>
          </div>
        </div>
      )}

      {openAlertInitiative && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn" dir="rtl">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-4 text-right">
            <button 
              onClick={() => setOpenAlertInitiative(null)}
              className="absolute top-4 left-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2 bg-rose-50 rounded-2xl">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">تنبيه كميات المواد المتبقية ⚠️</h3>
                <p className="text-slate-500 text-[10px] font-semibold">مبادرة: {openAlertInitiative.name}</p>
              </div>
            </div>

            <div className="space-y-3 py-1">
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                تم رصد كميات مواد دعم (إسمنت أو ديزل) متبقية وغير مستهلكة في هذه المبادرة الميدانية. يُخشى تلف الإسمنت جراء الرطوبة الجوية أو السيول، أو هدر الوقود في غير مصلحة العمل التنموي:
              </p>

              <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100">
                {(() => {
                  const details = getRemainingAlertDetails(openAlertInitiative);
                  return (
                    <>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-600">🧱 الأسمنت المتبقي:</span>
                        <span className={`font-mono font-black ${details.hasCement ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded' : 'text-slate-400'}`}>
                          {details.cementAmount || 'لا يوجد'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-100">
                        <span className="font-bold text-slate-600">⛽ الديزل المتبقي:</span>
                        <span className={`font-mono font-black ${details.hasDiesel ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded' : 'text-slate-400'}`}>
                          {details.dieselAmount || 'لا يوجد'}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 text-[11px] text-amber-800 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-amber-600" />
                  التوجيه الموصى به لفرسان التنمية:
                </div>
                <p className="leading-relaxed font-semibold">
                  يرجى التنسيق العاجل مع الهيئة الإدارية للجمعية التعاونية لإعداد محضر مناقلة طارئة وتحويل هذه المواد الفائضة إلى مبادرة جبلية أخرى نشطة بالمديرية لضمان سلامتها وتحقيق الأثر التنموي الفعلي.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setOpenAlertInitiative(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
              >
                حسناً، فهمت
              </button>
              <button
                onClick={() => {
                  const current = openAlertInitiative;
                  setOpenAlertInitiative(null);
                  onSelect(current);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-100"
              >
                عرض تفاصيل المبادرة 🔎
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
