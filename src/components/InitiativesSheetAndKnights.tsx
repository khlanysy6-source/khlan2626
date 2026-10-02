import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileSpreadsheet, 
  Users, 
  Plus, 
  Trash2, 
  Search, 
  Building, 
  Filter, 
  CheckCircle, 
  AlertCircle, 
  Save, 
  X, 
  Edit2, 
  UserPlus, 
  Phone, 
  MapPin, 
  Check, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowDownToLine,
  Layers,
  ArrowRightLeft,
  Sparkles,
  Link,
  HardHat,
  ShieldCheck,
  Award,
  UserCheck
} from 'lucide-react';
import { Initiative, Knight, UserRole } from '../types';
import { exportInitiativesToExcel } from '../utils/excelExporter';
import { getAllStoredOfficials, OfficialProfile } from '../data/officialsRegistry';

interface InitiativesSheetAndKnightsProps {
  initiatives: Initiative[];
  onUpdateInitiative: (updated: Initiative) => void;
  knights: Knight[];
  onAddKnight: (knight: Knight) => void;
  onUpdateKnight: (updated: Knight) => void;
  onDeleteKnight: (id: string) => void;
  userRole: UserRole | 'admin' | 'visitor';
}

export default function InitiativesSheetAndKnights({
  initiatives,
  onUpdateInitiative,
  knights,
  onAddKnight,
  onUpdateKnight,
  onDeleteKnight,
  userRole
}: InitiativesSheetAndKnightsProps) {
  // Local sub-tabs: 'sheet' (Spreadsheet View), 'knights' (Knights Directory)
  const [subTab, setSubTab] = useState<'sheet' | 'knights'>('sheet');
  
  // Sheet View Mode: 'all' (Unified 3 Sheets), 'officials' (Leadership & Officials Sheet), 'sheet1' (Financial/General), 'sheet2' (Executed Work), 'sheet3' (Technical Study)
  const [viewSheetMode, setViewSheetMode] = useState<'all' | 'officials' | 'sheet1' | 'sheet2' | 'sheet3'>('all');

  // Expanded row ID for showing the full 3-Sheets comparison card
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Spreadsheet States
  const [sheetSearch, setSheetSearch] = useState('');
  const [sheetDistrict, setSheetDistrict] = useState('all');
  const [sheetStatus, setSheetStatus] = useState('all');
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'completionRate' | 'status' } | null>(null);
  const [tempCompletion, setTempCompletion] = useState<number>(0);
  const [tempStatus, setTempStatus] = useState<Initiative['status']>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Knights directory states
  const [knightSearch, setKnightSearch] = useState('');
  const [knightDistrict, setKnightDistrict] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKnight, setNewKnight] = useState<{
    name: string;
    district: string;
    subDistrict: string;
    village: string;
    phone: string;
    specialty: string;
    status: 'active' | 'inactive';
    notes: string;
  }>({
    name: '',
    district: 'مديرية ذي السفال',
    subDistrict: '',
    village: '',
    phone: '',
    specialty: 'إشراف هندسي ومتابعة',
    status: 'active',
    notes: ''
  });

  // Extract unique districts from initiatives
  const districts = useMemo(() => {
    const set = new Set<string>();
    initiatives.forEach(init => {
      if (init.district) set.add(init.district);
    });
    return Array.from(set);
  }, [initiatives]);

  // Officials Registry & Leadership Lookup
  const storedOfficials = useMemo(() => getAllStoredOfficials(), []);

  const getInitiativeLeadership = (districtName: string) => {
    const cleanDistrict = districtName ? (districtName.startsWith('مديرية ') ? districtName : `مديرية ${districtName}`) : 'محافظة إب';
    const norm = (districtName || '').replace('مديرية ', '').trim();
    const districtOfficials = storedOfficials.filter(o => o.district && norm && o.district.includes(norm));

    const districtMgr = districtOfficials.find(o => 
      o.role?.includes('مدير عام المديرية') || 
      o.jobTitle?.includes('مدير عام')
    ) || {
      fullName: `السلطة المحلية بـ ${cleanDistrict}`,
      jobTitle: `مدير عام ${cleanDistrict} - رئيس المجلس المحلي`,
      scope: `الإشراف الإداري والتنسيق المحلي والميداني`,
      phone: ''
    };

    const coopHead = districtOfficials.find(o => 
      o.role?.includes('رئيس الجمعية') || 
      o.jobTitle?.includes('الجمعية')
    ) || {
      fullName: `الجمعية التعاونية بـ ${cleanDistrict}`,
      jobTitle: `رئيس الجمعية التعاونية التنموية متعددة الأغراض`,
      scope: `حشد وإسناد المشاركة المجتمعية بـ ${cleanDistrict}`,
      phone: ''
    };

    const engineer = districtOfficials.find(o => 
      o.role?.includes('مهندس') || 
      o.jobTitle?.includes('مهندس')
    ) || {
      fullName: `فريق الإشراف الفني والنزول الميداني`,
      jobTitle: `مهندس الإشراف الفني ومطابقة الأعمال الميدانية`,
      scope: `المطابقة والرفع الفني لمشاريع ${cleanDistrict}`,
      phone: ''
    };

    const unitHead = {
      fullName: 'رئيس وحدة التدخلات المركزية التنموية الطارئة',
      jobTitle: 'القيادة العامة المركزية',
      scope: 'الاعتماد النهائي للمشاريع وموازنات الدعم المركزي',
      phone: ''
    };

    const execMgr = {
      fullName: 'المدير التنفيذي للوحدة المركزية',
      jobTitle: 'الإدارة التنفيذية للوحدة',
      scope: 'إدارة خطة التدخلات وصرف المخصصات العينية',
      phone: ''
    };

    const unitRep = {
      fullName: 'ممثل وحدة التدخلات بمحافظة إب',
      jobTitle: 'فرع الوحدة بمحافظة إب',
      scope: 'النزول الميداني المشترك وحل الإشكاليات والتنسيق مع السلطة المحلية',
      phone: ''
    };

    return { districtMgr, coopHead, engineer, unitHead, execMgr, unitRep };
  };

  // Filtered initiatives for sheet
  const filteredInitiatives = useMemo(() => {
    return initiatives.filter(init => {
      const matchesSearch = init.name.toLowerCase().includes(sheetSearch.toLowerCase()) ||
                            init.initiativeNumber.toLowerCase().includes(sheetSearch.toLowerCase()) ||
                            (init.subDistrict && init.subDistrict.toLowerCase().includes(sheetSearch.toLowerCase()));
      const matchesDistrict = sheetDistrict === 'all' || init.district === sheetDistrict;
      const matchesStatus = sheetStatus === 'all' || init.status === sheetStatus;
      return matchesSearch && matchesDistrict && matchesStatus;
    });
  }, [initiatives, sheetSearch, sheetDistrict, sheetStatus]);

  // Pagination for spreadsheet
  const paginatedInitiatives = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInitiatives.slice(start, start + itemsPerPage);
  }, [filteredInitiatives, currentPage]);

  const totalPages = Math.ceil(filteredInitiatives.length / itemsPerPage) || 1;

  // Filtered knights list
  const filteredKnights = useMemo(() => {
    return knights.filter(k => {
      const matchesSearch = k.name.toLowerCase().includes(knightSearch.toLowerCase()) ||
                            k.specialty.toLowerCase().includes(knightSearch.toLowerCase()) ||
                            (k.phone && k.phone.includes(knightSearch));
      const matchesDistrict = knightDistrict === 'all' || k.district === knightDistrict;
      return matchesSearch && matchesDistrict;
    });
  }, [knights, knightSearch, knightDistrict]);

  // Save spreadsheet cell edit
  const handleSaveCell = (initId: string, field: 'completionRate' | 'status') => {
    const original = initiatives.find(i => i.id === initId);
    if (!original) return;

    let updated: Initiative;
    if (field === 'completionRate') {
      const val = Math.min(100, Math.max(0, Number(tempCompletion)));
      updated = {
        ...original,
        completionRate: val,
        status: val === 100 ? 'completed' : original.status,
        updatedAt: new Date().toISOString()
      };
    } else {
      updated = {
        ...original,
        status: tempStatus,
        completionRate: tempStatus === 'completed' ? 100 : original.completionRate,
        updatedAt: new Date().toISOString()
      };
    }

    onUpdateInitiative(updated);
    setEditingCell(null);
  };

  // Add new knight handler
  const handleCreateKnight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKnight.name.trim() || !newKnight.phone.trim()) {
      alert('يرجى ملء حقول الاسم والهاتف للفرس التنموي.');
      return;
    }

    const created: Knight = {
      id: `knight_${Date.now()}`,
      name: newKnight.name.trim(),
      district: newKnight.district,
      subDistrict: newKnight.subDistrict.trim() || 'عزلة عامة',
      village: newKnight.village.trim() || 'قرية عامة',
      phone: newKnight.phone.trim(),
      specialty: newKnight.specialty,
      status: newKnight.status,
      notes: newKnight.notes.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    onAddKnight(created);
    
    // Reset form
    setNewKnight({
      name: '',
      district: 'مديرية ذي السفال',
      subDistrict: '',
      village: '',
      phone: '',
      specialty: 'إشراف هندسي ومتابعة',
      status: 'active' as const,
      notes: ''
    });
    setShowAddForm(false);
  };

  // Export to Professional Styled Multi-Tab Excel Workbook
  const handleExportCSV = async () => {
    await exportInitiativesToExcel(initiatives, 'شيت_المبادرات_الموحد_الشيتات_الثلاثة');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-xs p-6 space-y-6 text-right" dir="rtl">
      {/* Top Main Navigation for Sheet & Knights */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <span>منظومة الرصد ودليل فرسان المديريات 📊</span>
          </h1>
          <p className="text-xs text-slate-500">
            شيت حاسوبي تفاعلي لمتابعة المبادرات بالكامل في جدول واحد، بالإضافة لتسجيل وإدارة فرسان التنمية بمحافظة إب
          </p>
        </div>

        {/* Tab switch buttons */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setSubTab('sheet')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'sheet' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>شيت متابعة المبادرات 📊</span>
          </button>
          
          <button
            onClick={() => setSubTab('knights')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'knights' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>دليل فرسان المديريات 👥</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* TAB 1: SPREADSHEET VIEW */}
        {subTab === 'sheet' && (
          <motion.div
            key="sheet"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {/* 3-Sheet View Mode Selector & Filtering Header */}
            <div className="space-y-3 bg-slate-50 border border-slate-200/80 p-4 rounded-2xl">
              {/* Sheet Mode Switcher Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>تصفح أعمدة الشيت الموحد الشامل:</span>
                </div>

                <div className="flex flex-wrap bg-slate-200/70 p-1 rounded-xl gap-1">
                  <button
                    onClick={() => { setViewSheetMode('all'); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                      viewSheetMode === 'all'
                        ? 'bg-indigo-700 text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-950 hover:bg-slate-300/60'
                    }`}
                  >
                    <Link className="w-3.5 h-3.5" />
                    <span>العرض الشامل الموحد (جميع البيانات والكميات 🔗)</span>
                  </button>

                  <button
                    onClick={() => { setViewSheetMode('officials'); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                      viewSheetMode === 'officials'
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-950 hover:bg-slate-300/60'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>👥 شيت القيادات والمسؤولين والفرسان</span>
                  </button>

                  <button
                    onClick={() => { setViewSheetMode('sheet1'); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                      viewSheetMode === 'sheet1'
                        ? 'bg-sky-700 text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-950 hover:bg-slate-300/60'
                    }`}
                  >
                    <span>💰 الميزانيات والإنفاق المالي</span>
                  </button>

                  <button
                    onClick={() => { setViewSheetMode('sheet2'); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                      viewSheetMode === 'sheet2'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-950 hover:bg-slate-300/60'
                    }`}
                  >
                    <span>🏗️ الأعمال والكميات المنفذة</span>
                  </button>

                  <button
                    onClick={() => { setViewSheetMode('sheet3'); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                      viewSheetMode === 'sheet3'
                        ? 'bg-amber-700 text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-950 hover:bg-slate-300/60'
                    }`}
                  >
                    <span>📐 المعايير المعتمدة بالدراسة</span>
                  </button>
                </div>
              </div>

              {/* Filtering Controls */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-1">
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  {/* Search */}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="ابحث بالاسم، الرقم، العزلة..."
                      value={sheetSearch}
                      onChange={(e) => { setSheetSearch(e.target.value); setCurrentPage(1); }}
                      className="w-full pr-9 pl-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  {/* District select */}
                  <select
                    value={sheetDistrict}
                    onChange={(e) => { setSheetDistrict(e.target.value); setCurrentPage(1); }}
                    className="w-full sm:w-44 px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                  >
                    <option value="all">كافة المديريات</option>
                    {districts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>

                  {/* Status select */}
                  <select
                    value={sheetStatus}
                    onChange={(e) => { setSheetStatus(e.target.value); setCurrentPage(1); }}
                    className="w-full sm:w-40 px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                  >
                    <option value="all">كافة الحالات</option>
                    <option value="pending">معلق</option>
                    <option value="ongoing">مستمر</option>
                    <option value="stagnant">متعثر</option>
                    <option value="completed">مكتمل</option>
                    <option value="stopped">متوقف</option>
                  </select>
                </div>

                {/* Export Button */}
                <button
                  onClick={handleExportCSV}
                  className="w-full md:w-auto px-4 py-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs"
                >
                  <ArrowDownToLine className="w-4 h-4 text-indigo-600" />
                  <span>تصدير الشيتات الثلاثة الموحدة (CSV)</span>
                </button>
              </div>
            </div>

            {/* Excel-style spreadsheet Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-3xs bg-white">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-right text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-slate-100 divide-x divide-x-reverse divide-slate-800">
                      <th className="p-3 font-bold text-center w-12 select-none">#</th>
                      <th className="p-3 font-bold w-28">رقم المبادرة</th>
                      <th className="p-3 font-bold min-w-[220px]">اسم المبادرة والبيان التنموي</th>
                      <th className="p-3 font-bold w-36">المديرية والعزلة</th>
                      
                      {viewSheetMode === 'all' && (
                        <>
                          <th className="p-3 font-bold w-32 text-left text-sky-300 bg-slate-950/60">💰 الميزانية والإنفاق</th>
                          <th className="p-3 font-bold w-36 text-center text-emerald-300 bg-slate-950/60">🏗️ المنفذ الميداني</th>
                          <th className="p-3 font-bold w-36 text-center text-amber-300 bg-slate-950/60">📐 المعتمد بالدراسة</th>
                        </>
                      )}

                      {viewSheetMode === 'officials' && (
                        <>
                          <th className="p-3 font-bold min-w-[200px] text-right text-purple-300 bg-slate-950/70">🏛️ مدير عام المديرية ورقم هاتفه</th>
                          <th className="p-3 font-bold min-w-[200px] text-right text-emerald-300 bg-slate-950/70">🤝 رئيس الجمعية التعاونية ورقم هاتفه</th>
                          <th className="p-3 font-bold min-w-[200px] text-right text-amber-300 bg-slate-950/70">👷‍♂️ مهندس الإشراف وفرسان الهندسة</th>
                          <th className="p-3 font-bold min-w-[200px] text-right text-sky-300 bg-slate-950/70">🏢 القيادة التنفيذية للوحدة</th>
                        </>
                      )}

                      {viewSheetMode === 'sheet1' && (
                        <>
                          <th className="p-3 font-bold w-32 text-left">التكلفة الكلية (ر.ي)</th>
                          <th className="p-3 font-bold w-32 text-left">مساهمة المجتمع</th>
                          <th className="p-3 font-bold w-32 text-left">مساهمة الوحدة</th>
                        </>
                      )}

                      {viewSheetMode === 'sheet2' && (
                        <>
                          <th className="p-3 font-bold w-24 text-center">عرض الطريق</th>
                          <th className="p-3 font-bold w-28 text-center">طول المنجز (م)</th>
                          <th className="p-3 font-bold w-28 text-center">الرصف (م2)</th>
                          <th className="p-3 font-bold w-32 text-left">تكلفة المنجز</th>
                        </>
                      )}

                      {viewSheetMode === 'sheet3' && (
                        <>
                          <th className="p-3 font-bold w-24 text-center">العرض المعتمد</th>
                          <th className="p-3 font-bold w-28 text-center">الطول المعتمد (م)</th>
                          <th className="p-3 font-bold w-28 text-center">رصف الدراسة (م2)</th>
                          <th className="p-3 font-bold w-32 text-left">تكلفة الدراسة</th>
                        </>
                      )}

                      <th className="p-3 font-bold w-24 text-center">الإنجاز</th>
                      <th className="p-3 font-bold w-24 text-center">الحالة</th>
                      <th className="p-3 font-bold w-24 text-center">مطابقة الشيتات</th>
                      {userRole === 'admin' && <th className="p-3 font-bold w-20 text-center">تعديل</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {paginatedInitiatives.map((item, idx) => {
                      const absoluteIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                      const isEditingCompletion = editingCell?.id === item.id && editingCell.field === 'completionRate';
                      const isEditingStatus = editingCell?.id === item.id && editingCell.field === 'status';
                      const isExpanded = expandedRowId === item.id;

                      const exec = item.executedWorkQuantities || {};
                      const appr = item.approvedStudyQuantities || {};
                      const execPaving = (exec.stonePaving || 0) + (exec.concretePaving || 0);
                      const apprPaving = (appr.stonePaving || 0) + (appr.concretePaving || 0);
                      const leadership = getInitiativeLeadership(item.district);

                      return (
                        <React.Fragment key={item.id}>
                          <tr className={`hover:bg-indigo-50/20 divide-x divide-x-reverse divide-slate-100 transition-colors ${isExpanded ? 'bg-indigo-50/40' : ''}`}>
                            {/* Row Counter */}
                            <td className="p-2.5 text-center bg-slate-50/60 font-mono text-slate-500 font-bold select-none">{absoluteIndex}</td>
                            
                            {/* Initiative Number */}
                            <td className="p-2.5 font-bold font-mono text-slate-700">{item.initiativeNumber}</td>
                            
                            {/* Initiative Name */}
                            <td className="p-2.5 font-black text-slate-900 leading-normal max-w-sm">
                              <div className="space-y-0.5">
                                <div>{item.name}</div>
                                <div className="text-[10px] text-slate-400 font-medium font-mono">
                                  {item.coordinates ? `📍 ${item.coordinates}` : 'قرية: ' + item.village}
                                </div>
                              </div>
                            </td>
                            
                            {/* District */}
                            <td className="p-2.5 font-bold text-slate-700">
                              <div>{item.district}</div>
                              <div className="text-[10px] text-slate-500 font-normal">{item.subDistrict}</div>
                            </td>
                            
                            {/* DYNAMIC COLUMNS PER SHEET VIEW MODE */}
                            {viewSheetMode === 'all' && (
                              <>
                                {/* Sheet 1 Cost */}
                                <td className="p-2.5 text-left font-mono font-extrabold text-sky-800 bg-sky-50/20">
                                  {(item.cost || 0).toLocaleString()} <span className="text-[9px] text-sky-600 font-sans">ر.ي</span>
                                </td>

                                {/* Sheet 2 Executed Quantities */}
                                <td className="p-2.5 text-center font-mono font-bold text-emerald-800 bg-emerald-50/20">
                                  {exec.lengthCompleted ? (
                                    <span>{exec.lengthCompleted.toLocaleString()} م {execPaving > 0 ? `| ${execPaving} م2` : ''}</span>
                                  ) : (
                                    <span className="text-slate-400 text-[10px] font-sans">غير مسجل</span>
                                  )}
                                </td>

                                {/* Sheet 3 Approved Study Quantities */}
                                <td className="p-2.5 text-center font-mono font-bold text-amber-800 bg-amber-50/20">
                                  {appr.lengthCompleted ? (
                                    <span>{appr.lengthCompleted.toLocaleString()} م {apprPaving > 0 ? `| ${apprPaving} م2` : ''}</span>
                                  ) : (
                                    <span className="text-slate-400 text-[10px] font-sans">غير مسجل</span>
                                  )}
                                </td>
                              </>
                            )}

                            {viewSheetMode === 'officials' && (
                              <>
                                {/* 1. مدير عام المديرية */}
                                <td className="p-2.5 text-right bg-purple-50/20">
                                  <div className="space-y-0.5">
                                    <div className="font-extrabold text-slate-900 text-xs">
                                      {leadership.districtMgr.fullName}
                                    </div>
                                    <div className="text-[10px] text-purple-800 font-bold">
                                      {leadership.districtMgr.jobTitle}
                                    </div>
                                    <div className="text-[10px] text-slate-500 line-clamp-1" title={leadership.districtMgr.scope}>
                                      📍 {leadership.districtMgr.scope}
                                    </div>
                                    {leadership.districtMgr.phone && (
                                      <div className="text-[10px] font-mono text-purple-700">
                                        📞 {leadership.districtMgr.phone}
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* 2. الجمعية التعاونية */}
                                <td className="p-2.5 text-right bg-emerald-50/20">
                                  <div className="space-y-0.5">
                                    <div className="font-extrabold text-slate-900 text-xs">
                                      {leadership.coopHead.fullName}
                                    </div>
                                    <div className="text-[10px] text-emerald-800 font-bold">
                                      {leadership.coopHead.jobTitle}
                                    </div>
                                    <div className="text-[10px] text-slate-500 line-clamp-1" title={leadership.coopHead.scope}>
                                      🤝 {leadership.coopHead.scope}
                                    </div>
                                    {leadership.coopHead.phone && (
                                      <div className="text-[10px] font-mono text-emerald-700">
                                        📞 {leadership.coopHead.phone}
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* 3. مهندس الإشراف وفريق النزول */}
                                <td className="p-2.5 text-right bg-amber-50/20">
                                  <div className="space-y-0.5">
                                    <div className="font-extrabold text-slate-900 text-xs">
                                      {leadership.engineer.fullName}
                                    </div>
                                    <div className="text-[10px] text-amber-800 font-bold">
                                      {leadership.engineer.jobTitle}
                                    </div>
                                    <div className="text-[10px] text-slate-500 line-clamp-1" title={leadership.engineer.scope}>
                                      👷‍♂️ {leadership.engineer.scope}
                                    </div>
                                    {leadership.engineer.phone && (
                                      <div className="text-[10px] font-mono text-amber-800">
                                        📞 {leadership.engineer.phone}
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* 4. قيادة الوحدة المركزية وممثلوها */}
                                <td className="p-2.5 text-right bg-sky-50/20">
                                  <div className="space-y-1 text-[11px]">
                                    <div className="font-extrabold text-slate-900 leading-tight">
                                      🏛️ {leadership.unitHead.fullName}
                                    </div>
                                    <div className="text-slate-700 font-bold text-[10px]">
                                      ⚡ {leadership.execMgr.fullName}
                                    </div>
                                    <div className="text-sky-800 font-medium text-[10px]">
                                      📍 {leadership.unitRep.fullName}
                                    </div>
                                  </div>
                                </td>
                              </>
                            )}

                            {viewSheetMode === 'sheet1' && (
                              <>
                                <td className="p-2.5 text-left font-mono font-extrabold text-slate-800">
                                  {(item.cost || 0).toLocaleString()}
                                </td>
                                <td className="p-2.5 text-left font-mono font-bold text-indigo-700">
                                  {(item.communityContribution || 0).toLocaleString()}
                                </td>
                                <td className="p-2.5 text-left font-mono font-bold text-emerald-700">
                                  {(item.unitContribution || 0).toLocaleString()}
                                </td>
                              </>
                            )}

                            {viewSheetMode === 'sheet2' && (
                              <>
                                <td className="p-2.5 text-center font-mono font-bold text-slate-700">
                                  {exec.avgWidth ? `${exec.avgWidth} م` : '-'}
                                </td>
                                <td className="p-2.5 text-center font-mono font-bold text-emerald-700">
                                  {exec.lengthCompleted ? `${exec.lengthCompleted.toLocaleString()} م` : '-'}
                                </td>
                                <td className="p-2.5 text-center font-mono font-bold text-slate-800">
                                  {execPaving ? `${execPaving.toLocaleString()} م2` : '-'}
                                </td>
                                <td className="p-2.5 text-left font-mono font-extrabold text-slate-900">
                                  {item.executionCostCompleted ? item.executionCostCompleted.toLocaleString() : '-'}
                                </td>
                              </>
                            )}

                            {viewSheetMode === 'sheet3' && (
                              <>
                                <td className="p-2.5 text-center font-mono font-bold text-slate-700">
                                  {appr.avgWidth ? `${appr.avgWidth} م` : '-'}
                                </td>
                                <td className="p-2.5 text-center font-mono font-bold text-amber-700">
                                  {appr.lengthCompleted ? `${appr.lengthCompleted.toLocaleString()} م` : '-'}
                                </td>
                                <td className="p-2.5 text-center font-mono font-bold text-slate-800">
                                  {apprPaving ? `${apprPaving.toLocaleString()} م2` : '-'}
                                </td>
                                <td className="p-2.5 text-left font-mono font-extrabold text-slate-900">
                                  {item.cost ? item.cost.toLocaleString() : '-'}
                                </td>
                              </>
                            )}

                            {/* Completion rate (Inline Edit) */}
                            <td className="p-2.5 text-center">
                              {isEditingCompletion ? (
                                <div className="flex items-center gap-1 justify-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={tempCompletion}
                                    onChange={(e) => setTempCompletion(Number(e.target.value))}
                                    className="w-16 p-1 border border-indigo-500 rounded bg-white text-center font-bold text-xs"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleSaveCell(item.id, 'completionRate')}
                                    className="p-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingCell(null)}
                                    className="p-1 bg-rose-100 text-rose-800 hover:bg-rose-200 rounded cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div 
                                  className={`inline-flex items-center gap-1 justify-center font-black ${
                                    userRole === 'admin' ? 'cursor-pointer hover:bg-slate-100 px-2 py-0.5 rounded transition-all' : ''
                                  }`}
                                  onClick={() => {
                                    if (userRole === 'admin') {
                                      setEditingCell({ id: item.id, field: 'completionRate' });
                                      setTempCompletion(item.completionRate);
                                    }
                                  }}
                                >
                                  <span className={item.completionRate === 100 ? 'text-emerald-700' : 'text-slate-800'}>
                                    {item.completionRate}%
                                  </span>
                                  {userRole === 'admin' && <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />}
                                </div>
                              )}
                            </td>

                            {/* Status Badge (Inline Edit) */}
                            <td className="p-2.5 text-center">
                              {isEditingStatus ? (
                                <div className="flex items-center gap-1 justify-center">
                                  <select
                                    value={tempStatus}
                                    onChange={(e) => setTempStatus(e.target.value as Initiative['status'])}
                                    className="p-1 border border-indigo-500 rounded bg-white text-[10px] font-bold"
                                    autoFocus
                                  >
                                    <option value="pending">معلق</option>
                                    <option value="ongoing">مستمر</option>
                                    <option value="stagnant">متعثر</option>
                                    <option value="completed">مكتمل</option>
                                    <option value="stopped">متوقف</option>
                                  </select>
                                  <button
                                    onClick={() => handleSaveCell(item.id, 'status')}
                                    className="p-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingCell(null)}
                                    className="p-1 bg-rose-100 text-rose-800 hover:bg-rose-200 rounded cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                    item.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                    item.status === 'stagnant' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                    item.status === 'ongoing' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                                    item.status === 'stopped' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                    'bg-slate-50 text-slate-600 border border-slate-200'
                                  } ${userRole === 'admin' ? 'cursor-pointer hover:opacity-85' : ''}`}
                                  onClick={() => {
                                    if (userRole === 'admin') {
                                      setEditingCell({ id: item.id, field: 'status' });
                                      setTempStatus(item.status);
                                    }
                                  }}
                                >
                                  {item.status === 'completed' ? 'مكتمل ✅' :
                                   item.status === 'stagnant' ? 'متعثر ⚠️' :
                                   item.status === 'ongoing' ? 'مستمر 🚀' :
                                   item.status === 'stopped' ? 'متوقف 🛑' : 'معلق 💤'}
                                </span>
                              )}
                            </td>

                            {/* Expand Row Comparison Button */}
                            <td className="p-2.5 text-center">
                              <button
                                onClick={() => setExpandedRowId(isExpanded ? null : item.id)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer inline-flex items-center gap-1 ${
                                  isExpanded
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                                }`}
                              >
                                <span>{isExpanded ? 'إغلاق' : 'بطاقة الربط 🔗'}</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            </td>

                            {/* Quick Action pencil */}
                            {userRole === 'admin' && (
                              <td className="p-2.5 text-center">
                                <div className="flex justify-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      setEditingCell({ id: item.id, field: 'completionRate' });
                                      setTempCompletion(item.completionRate);
                                    }}
                                    className="p-1 text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer"
                                    title="تعديل نسبة الإنجاز"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>

                          {/* EXPANDED ROW: 3-SHEETS UNIFIED CARD AND COMPARISON */}
                          {isExpanded && (
                            <tr className="bg-slate-900 text-slate-100">
                              <td colSpan={14} className="p-4 space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                  <div className="flex items-center gap-2 text-amber-400 font-black text-xs">
                                    <Sparkles className="w-4 h-4" />
                                    <span>تفاصيل الربط التلقائي والربط الثلاثي للمبادرة ({item.name}):</span>
                                  </div>
                                  <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
                                    معرّف المبادرة: {item.initiativeNumber || item.id}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] font-sans">
                                  {/* Card 1: Financial */}
                                  <div className="bg-slate-950/80 border border-sky-900/60 p-3 rounded-xl space-y-2">
                                    <div className="font-extrabold text-sky-400 flex items-center justify-between border-b border-sky-900/40 pb-1">
                                      <span>💰 ميزانية المبادرة المعتمدة</span>
                                      <span className="text-[9px] text-sky-500 font-mono">الكشف المالي</span>
                                    </div>
                                    <div className="space-y-1 text-slate-300 font-mono text-[10px]">
                                      <div>• التكلفة الإجمالية: <b className="text-white">{(item.cost || 0).toLocaleString()} ر.ي</b></div>
                                      <div>• مساهمة المجتمع: <b className="text-sky-300">{(item.communityContribution || 0).toLocaleString()} ر.ي</b></div>
                                      <div>• مساهمة الوحدة: <b className="text-emerald-300">{(item.unitContribution || 0).toLocaleString()} ر.ي</b></div>
                                      <div>• نسبة الإنجاز العامة: <b className="text-amber-300">{item.completionRate}%</b></div>
                                    </div>
                                  </div>

                                  {/* Card 2: Executed */}
                                  <div className="bg-slate-950/80 border border-emerald-900/60 p-3 rounded-xl space-y-2">
                                    <div className="font-extrabold text-emerald-400 flex items-center justify-between border-b border-emerald-900/40 pb-1">
                                      <span>🏗️ الأعمال والكميات المنفذة ميدانياً</span>
                                      <span className="text-[9px] text-emerald-500 font-mono">الأعمال المنجزة</span>
                                    </div>
                                    <div className="space-y-1 text-slate-300 font-mono text-[10px]">
                                      <div>• متوسط عرض الطريق: <b className="text-white">{exec.avgWidth ? `${exec.avgWidth} م` : 'غير مدخل'}</b></div>
                                      <div>• الطول المنجز ميدانياً: <b className="text-emerald-300">{exec.lengthCompleted ? `${exec.lengthCompleted.toLocaleString()} م` : 'غير مدخل'}</b></div>
                                      <div>• الرصف المنفذ: <b className="text-sky-300">{execPaving ? `${execPaving.toLocaleString()} م2` : 'غير مدخل'}</b></div>
                                      <div>• تكلفة المنفذ الميداني: <b className="text-amber-300">{item.executionCostCompleted ? `${item.executionCostCompleted.toLocaleString()} ر.ي` : 'غير مدخل'}</b></div>
                                    </div>
                                  </div>

                                  {/* Card 3: Study */}
                                  <div className="bg-slate-950/80 border border-amber-900/60 p-3 rounded-xl space-y-2">
                                    <div className="font-extrabold text-amber-400 flex items-center justify-between border-b border-amber-900/40 pb-1">
                                      <span>📐 الكميات والمواصفات المعتمدة بالدراسة</span>
                                      <span className="text-[9px] text-amber-500 font-mono">المعايير المعتمدة</span>
                                    </div>
                                    <div className="space-y-1 text-slate-300 font-mono text-[10px]">
                                      <div>• متوسط العرض المعتمد: <b className="text-white">{appr.avgWidth ? `${appr.avgWidth} م` : 'غير مدخل'}</b></div>
                                      <div>• الطول الفني بالدراسة: <b className="text-amber-300">{appr.lengthCompleted ? `${appr.lengthCompleted.toLocaleString()} م` : 'غير مدخل'}</b></div>
                                      <div>• الرصف المعتمد بالدراسة: <b className="text-sky-300">{apprPaving ? `${apprPaving.toLocaleString()} م2` : 'غير مدخل'}</b></div>
                                      <div>• التكلفة التقديرية للدراسة: <b className="text-white">{item.cost ? `${item.cost.toLocaleString()} ر.ي` : 'غير مدخل'}</b></div>
                                    </div>
                                  </div>

                                  {/* Card 4: Responsible Officials & Leadership */}
                                  <div className="bg-slate-950/80 border border-purple-900/60 p-3 rounded-xl space-y-2 col-span-1 md:col-span-3">
                                    <div className="font-extrabold text-purple-400 flex items-center justify-between border-b border-purple-900/40 pb-1">
                                      <span className="flex items-center gap-1.5">
                                        <Users className="w-4 h-4 text-purple-400" />
                                        <span>👥 جهات الإشراف والقيادة المسؤولة عن المبادرة ({item.district})</span>
                                      </span>
                                      <span className="text-[9px] text-purple-400 font-mono">الهيكل المؤسسي المعتمد بالشيت</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-slate-300 text-[10px]">
                                      <div className="bg-slate-900/90 p-2.5 rounded-lg border border-purple-950 space-y-1">
                                        <span className="text-purple-400 block font-bold text-[9px]">🏛️ مدير عام المديرية</span>
                                        <div className="font-black text-white">{leadership.districtMgr.fullName}</div>
                                        <div className="text-[9px] text-purple-300">{leadership.districtMgr.jobTitle}</div>
                                        <div className="text-[9px] text-slate-400">{leadership.districtMgr.scope}</div>
                                      </div>

                                      <div className="bg-slate-900/90 p-2.5 rounded-lg border border-emerald-950 space-y-1">
                                        <span className="text-emerald-400 block font-bold text-[9px]">🤝 الجمعية التعاونية</span>
                                        <div className="font-black text-white">{leadership.coopHead.fullName}</div>
                                        <div className="text-[9px] text-emerald-300">{leadership.coopHead.jobTitle}</div>
                                        <div className="text-[9px] text-slate-400">{leadership.coopHead.scope}</div>
                                      </div>

                                      <div className="bg-slate-900/90 p-2.5 rounded-lg border border-amber-950 space-y-1">
                                        <span className="text-amber-400 block font-bold text-[9px]">👷‍♂️ مهندس الإشراف والنزول</span>
                                        <div className="font-black text-white">{leadership.engineer.fullName}</div>
                                        <div className="text-[9px] text-amber-300">{leadership.engineer.jobTitle}</div>
                                        <div className="text-[9px] text-slate-400">{leadership.engineer.scope}</div>
                                      </div>

                                      <div className="bg-slate-900/90 p-2.5 rounded-lg border border-sky-950 space-y-1">
                                        <span className="text-sky-400 block font-bold text-[9px]">🏢 قيادة الوحدة المركزية</span>
                                        <div className="font-black text-white">{leadership.unitHead.fullName}</div>
                                        <div className="text-[9px] text-slate-300">{leadership.execMgr.fullName}</div>
                                        <div className="text-[9px] text-sky-400">{leadership.unitRep.fullName}</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Comparison Table */}
                                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[10px]">
                                  <div className="font-extrabold text-slate-300 mb-2 flex items-center gap-1">
                                    <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
                                    <span>مقارنة الفوارق المباشرة بين الدراسة الفنية المعتمدة والمنفذ ميدانياً:</span>
                                  </div>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center">
                                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                                      <span className="text-slate-400 block text-[9px] font-sans">فارق الطول (م)</span>
                                      <span className={`font-black ${
                                        (exec.lengthCompleted || 0) >= (appr.lengthCompleted || 0) ? 'text-emerald-400' : 'text-amber-400'
                                      }`}>
                                        {appr.lengthCompleted && exec.lengthCompleted ? `${exec.lengthCompleted - appr.lengthCompleted} م` : 'مطابق/غير مدخل'}
                                      </span>
                                    </div>

                                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                                      <span className="text-slate-400 block text-[9px] font-sans">فارق الرصف (م2)</span>
                                      <span className={`font-black ${
                                        execPaving >= apprPaving ? 'text-emerald-400' : 'text-amber-400'
                                      }`}>
                                        {apprPaving && execPaving ? `${execPaving - apprPaving} م2` : 'مطابق/غير مدخل'}
                                      </span>
                                    </div>

                                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                                      <span className="text-slate-400 block text-[9px] font-sans">فارق التكلفة (ر.ي)</span>
                                      <span className="font-black text-sky-400">
                                        {item.cost && item.executionCostCompleted ? `${(item.executionCostCompleted - item.cost).toLocaleString()} ر.ي` : 'مطابق/غير مدخل'}
                                      </span>
                                    </div>

                                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                                      <span className="text-slate-400 block text-[9px] font-sans">حالة التغطية الثلاثية</span>
                                      <span className="font-black text-emerald-400 font-sans">مربوط بالكامل 100%</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination controls */}
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-slate-500 font-bold">
                عرض المبادرات {Math.min(filteredInitiatives.length, (currentPage - 1) * itemsPerPage + 1)} إلى {Math.min(filteredInitiatives.length, currentPage * itemsPerPage)} من أصل {filteredInitiatives.length} مبادرة
              </span>
              
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="p-1.5 border border-slate-200 hover:border-slate-300 rounded-lg text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer bg-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                
                <span className="text-xs font-black text-slate-800 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg">
                  الصفحة {currentPage} من {totalPages}
                </span>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="p-1.5 border border-slate-200 hover:border-slate-300 rounded-lg text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer bg-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: KNIGHTS DIRECTORY */}
        {subTab === 'knights' && (
          <motion.div
            key="knights"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {/* Filter bar & Add Knight trigger */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-50 border border-slate-200/60 p-4 rounded-2xl">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ابحث عن فارس بالاسم، التخصص، أو الهاتف..."
                    value={knightSearch}
                    onChange={(e) => setKnightSearch(e.target.value)}
                    className="w-full pr-9 pl-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <select
                  value={knightDistrict}
                  onChange={(e) => setKnightDistrict(e.target.value)}
                  className="w-full sm:w-44 px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="all">كافة المديريات</option>
                  {districts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Add Knight Button */}
              {userRole === 'admin' && (
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="w-full md:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>إضافة فارس تنموي جديد للمحافظة</span>
                </button>
              )}
            </div>

            {/* Form to add Knight */}
            <AnimatePresence>
              {showAddForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-slate-50/50 border border-indigo-100 rounded-2xl p-5 overflow-hidden shadow-xs"
                >
                  <form onSubmit={handleCreateKnight} className="space-y-4">
                    <div className="flex justify-between items-center border-b border-indigo-100/50 pb-2 mb-2">
                      <h3 className="font-extrabold text-indigo-900 text-xs sm:text-sm">
                        إعداد وتسجيل فارس تنموي جديد
                      </h3>
                      <button 
                        type="button" 
                        onClick={() => setShowAddForm(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Name */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-600">الاسم الكامل للفارس *</label>
                        <input
                          type="text"
                          required
                          value={newKnight.name}
                          onChange={(e) => setNewKnight({ ...newKnight, name: e.target.value })}
                          placeholder="الاسم الثلاثي أو الرباعي"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-600">رقم الهاتف الجوال *</label>
                        <input
                          type="text"
                          required
                          value={newKnight.phone}
                          onChange={(e) => setNewKnight({ ...newKnight, phone: e.target.value })}
                          placeholder="مثال: 777123456"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
                        />
                      </div>

                      {/* District Selection */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-600">المديرية المتواجد بها *</label>
                        <select
                          value={newKnight.district}
                          onChange={(e) => setNewKnight({ ...newKnight, district: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-hidden focus:border-indigo-500"
                        >
                          {districts.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      {/* Specialty Dropdown */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-600">التخصص / المهام التنموية *</label>
                        <select
                          value={newKnight.specialty}
                          onChange={(e) => setNewKnight({ ...newKnight, specialty: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-hidden focus:border-indigo-500"
                        >
                          <option value="إشراف هندسي ومتابعة">إشراف هندسي ومتابعة 📐</option>
                          <option value="تحشيد مجتمعي وعيني">تحشيد مجتمعي وعيني ✊</option>
                          <option value="رصد وتقييم ومطابقة">رصد وتقييم ومطابقة 📝</option>
                          <option value="رئيس لجان الفرسان">رئيس لجان الفرسان 👑</option>
                          <option value="إرشاد وتوعية زراعية وتنموية">إرشاد وتوعية زراعية وتنموية 🌱</option>
                        </select>
                      </div>

                      {/* SubDistrict */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-600">العزلة</label>
                        <input
                          type="text"
                          value={newKnight.subDistrict}
                          onChange={(e) => setNewKnight({ ...newKnight, subDistrict: e.target.value })}
                          placeholder="مثال: عزلة ريدة"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden"
                        />
                      </div>

                      {/* Village */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-600">القرية</label>
                        <input
                          type="text"
                          value={newKnight.village}
                          onChange={(e) => setNewKnight({ ...newKnight, village: e.target.value })}
                          placeholder="مثال: قرية المحل"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden"
                        />
                      </div>

                      {/* Status select */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-600">حالة النشاط</label>
                        <select
                          value={newKnight.status}
                          onChange={(e) => setNewKnight({ ...newKnight, status: e.target.value as 'active' | 'inactive' })}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-hidden"
                        >
                          <option value="active">نشط وميداني 🔥</option>
                          <option value="inactive">غير نشط حالياً 💤</option>
                        </select>
                      </div>

                      {/* Notes */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-600">ملاحظات إضافية</label>
                        <input
                          type="text"
                          value={newKnight.notes}
                          onChange={(e) => setNewKnight({ ...newKnight, notes: e.target.value })}
                          placeholder="أي ملاحظات حول الفارس التنموي"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-xs"
                      >
                        حفظ وتسجيل الفارس بالمنظومة 💾
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Knights Grid List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredKnights.length === 0 ? (
                <div className="col-span-full text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-black text-slate-500">لا يوجد أي فرسان تنمويين مطابقين للفلاتر المحددة.</p>
                </div>
              ) : (
                filteredKnights.map((knight) => {
                  // Count initiatives in the knight's district
                  const districtInits = initiatives.filter(i => i.district === knight.district);
                  const activeInits = districtInits.filter(i => i.status === 'ongoing').length;

                  return (
                    <div 
                      key={knight.id}
                      className="border border-slate-200/80 hover:border-indigo-200 bg-white rounded-2xl p-4.5 space-y-3.5 relative overflow-hidden transition-all hover:shadow-3xs text-right"
                    >
                      {/* Top banner accent based on activity status */}
                      <div className={`absolute top-0 right-0 left-0 h-1 ${
                        knight.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}></div>

                      <div className="flex justify-between items-start gap-2 pt-1">
                        <div className="space-y-0.5">
                          <h3 className="font-extrabold text-slate-900 text-sm">{knight.name}</h3>
                          <span className="inline-flex px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-extrabold text-[10px]">
                            {knight.specialty}
                          </span>
                        </div>
                        
                        {/* Status tag */}
                        <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-black ${
                          knight.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {knight.status === 'active' ? 'نشط 🔥' : 'غير نشط 💤'}
                        </span>
                      </div>

                      {/* Contact & District Info */}
                      <div className="space-y-1.5 text-xs text-slate-600 border-t border-b border-slate-100 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <strong className="font-bold text-slate-800">{knight.district}</strong>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{knight.subDistrict} - {knight.village}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <a href={`tel:${knight.phone}`} className="font-mono font-bold text-slate-700 hover:underline">{knight.phone}</a>
                        </div>
                      </div>

                      {/* District Metrics Info */}
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold">
                        <span>مبادرات مديريته الإجمالية:</span>
                        <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-sm">
                          {districtInits.length} ({activeInits} جارية)
                        </span>
                      </div>

                      {/* Extra Notes if any */}
                      {knight.notes && (
                        <p className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg text-justify leading-snug">
                          {knight.notes}
                        </p>
                      )}

                      {/* Delete actions for admin */}
                      {userRole === 'admin' && (
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف الفارس التنموي (${knight.name}) من الدليل؟`)) {
                                onDeleteKnight(knight.id);
                              }
                            }}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="حذف الفارس"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
