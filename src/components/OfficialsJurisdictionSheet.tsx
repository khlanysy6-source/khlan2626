/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Officials Jurisdiction & Contact Sheet Component
 * شيت بيانات ومصفوفة مسؤولي المديريات ومناطق الصلاحيات وأرقام التواصل
 */

import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Search,
  Filter,
  Phone,
  PhoneCall,
  MessageSquare,
  MapPin,
  Building,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Download,
  Printer,
  Copy,
  Check,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Eye,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowUpDown,
  UserCheck,
  Briefcase,
  Upload
} from 'lucide-react';
import {
  OfficialProfile,
  getAllStoredOfficials,
  saveStoredOfficials,
  INITIAL_OFFICIALS
} from '../data/officialsRegistry';
import { importedInitiatives } from '../importedData';
import OfficialsExcelImportModal from './OfficialsExcelImportModal';

interface OfficialsJurisdictionSheetProps {
  onSelectOfficial?: (official: OfficialProfile) => void;
  onNavigateToInitiative?: (initiativeId: string) => void;
}

export default function OfficialsJurisdictionSheet({
  onSelectOfficial,
  onNavigateToInitiative
}: OfficialsJurisdictionSheetProps) {
  const [officials, setOfficials] = useState<OfficialProfile[]>(() => getAllStoredOfficials());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedPermission, setSelectedPermission] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [editingOfficial, setEditingOfficial] = useState<OfficialProfile | null>(null);
  const [viewingOfficial, setViewingOfficial] = useState<OfficialProfile | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState<Partial<OfficialProfile>>({
    fullName: '',
    phone: '',
    email: '',
    jobTitle: '',
    organization: 'وحدة التدخلات المركزية التنموية الطارئة',
    governorate: 'محافظة إب',
    district: 'مديرية ذي السفال',
    scope: '',
    role: 'مدير عام المديرية',
    permissionLevel: 'executive',
    accountStatus: 'linked_active'
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Extract unique districts from initiatives + registry
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

  // Initiative count map by district
  const initiativeCountByDistrict = useMemo(() => {
    const map: Record<string, number> = {};
    importedInitiatives.forEach(i => {
      const d = i.district || 'غير محدد';
      map[d] = (map[d] || 0) + 1;
    });
    return map;
  }, []);

  // Filtered Officials
  const filteredOfficials = useMemo(() => {
    return officials.filter(o => {
      const q = searchTerm.trim().toLowerCase();
      const matchSearch =
        !q ||
        o.fullName?.toLowerCase().includes(q) ||
        o.phone?.includes(q) ||
        o.district?.toLowerCase().includes(q) ||
        o.scope?.toLowerCase().includes(q) ||
        o.jobTitle?.toLowerCase().includes(q) ||
        o.organization?.toLowerCase().includes(q) ||
        o.email?.toLowerCase().includes(q);

      const matchDistrict =
        selectedDistrict === 'all' ||
        o.district === selectedDistrict ||
        (o.district?.includes('كافة مديريات') && selectedDistrict !== 'all');

      const matchPermission =
        selectedPermission === 'all' || o.permissionLevel === selectedPermission;

      return matchSearch && matchDistrict && matchPermission;
    });
  }, [officials, searchTerm, selectedDistrict, selectedPermission]);

  // Stats
  const stats = useMemo(() => {
    const total = officials.length;
    const executives = officials.filter(o => o.permissionLevel === 'executive' || o.permissionLevel === 'admin').length;
    const engineers = officials.filter(o => o.permissionLevel === 'supervisory' || o.permissionLevel === 'field').length;
    const distinctDistricts = new Set(officials.map(o => o.district)).size;
    return { total, executives, engineers, distinctDistricts };
  }, [officials]);

  // Copy phone number or contact row
  const handleCopyPhone = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Copy whole contacts list
  const handleCopyAllContacts = () => {
    const text = filteredOfficials
      .map(
        (o, idx) =>
          `${idx + 1}. ${o.fullName} | هاتف: ${o.phone} | منطقة الصلاحيات: ${o.scope || o.district} | الوظيفة: ${o.jobTitle}`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  // Export to Excel / CSV with UTF-8 BOM
  const handleExportCSV = () => {
    const headers = [
      'م',
      'الاسم الكامل',
      'رقم الهاتف',
      'منطقة ونطاق الصلاحيات',
      'المديرية',
      'المسمى الوظيفي',
      'الجهة التابع لها',
      'مستوى الصلاحية',
      'الدور المؤسسي',
      'البريد الإلكتروني',
      'حالة الحساب',
      'المحافظة'
    ];

    const rows = filteredOfficials.map((o, idx) => [
      idx + 1,
      `"${(o.fullName || '').replace(/"/g, '""')}"`,
      `"${o.phone || ''}"`,
      `"${(o.scope || '').replace(/"/g, '""')}"`,
      `"${(o.district || '').replace(/"/g, '""')}"`,
      `"${(o.jobTitle || '').replace(/"/g, '""')}"`,
      `"${(o.organization || '').replace(/"/g, '""')}"`,
      `"${o.permissionLevel || ''}"`,
      `"${(o.role || '').replace(/"/g, '""')}"`,
      `"${o.email || ''}"`,
      `"${o.accountStatus || ''}"`,
      `"${o.governorate || 'محافظة إب'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `شيت_مسؤولي_المديريات_ومناطق_الصلاحيات_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Sheet View
  const handlePrint = () => {
    window.print();
  };

  // Save new official
  const handleSaveOfficial = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formData.fullName || formData.fullName.trim().length < 3) {
      setFormError('يرجى إدخال اسم المسؤول بشكل ثلاثي أو رباعي صحيح.');
      return;
    }
    if (!formData.phone || formData.phone.trim().length < 9) {
      setFormError('يرجى إدخال رقم هاتف صحيح معتمد (9 أرقام على الأقل).');
      return;
    }

    if (editingOfficial) {
      const updatedList = officials.map(o => {
        if (o.id === editingOfficial.id) {
          return {
            ...o,
            ...formData,
            updatedAt: new Date().toISOString()
          } as OfficialProfile;
        }
        return o;
      });
      setOfficials(updatedList);
      saveStoredOfficials(updatedList);
      setFormSuccess('تم تحديث بيانات المسؤول ومنطقة صلاحياته بنجاح.');
      setTimeout(() => {
        setEditingOfficial(null);
        setShowAddModal(false);
        setFormSuccess(null);
      }, 1200);
    } else {
      const newOfficial: OfficialProfile = {
        id: `off_${Date.now()}`,
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email?.trim() || '',
        jobTitle: formData.jobTitle?.trim() || 'مسؤول تنفيذي',
        organization: formData.organization?.trim() || 'وحدة التدخلات المركزية',
        governorate: formData.governorate || 'محافظة إب',
        district: formData.district || 'مديرية ذي السفال',
        scope: formData.scope?.trim() || `نطاق ${formData.district || ''}`,
        role: formData.role || 'مسؤول ميداني',
        permissionLevel: (formData.permissionLevel as any) || 'field',
        accountStatus: 'linked_active',
        assignedInitiativeIds: [],
        assignedDecisionIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: 'تمت الإضافة عبر شيت المسؤولين ومناطق الصلاحيات'
      };

      const updatedList = [newOfficial, ...officials];
      setOfficials(updatedList);
      saveStoredOfficials(updatedList);
      setFormSuccess('تمت إضافة المسؤول الجديد للشيت بنجاح.');
      setTimeout(() => {
        setShowAddModal(false);
        setFormSuccess(null);
        setFormData({
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
          accountStatus: 'linked_active'
        });
      }, 1200);
    }
  };

  // Delete official from sheet
  const handleDeleteOfficial = (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف المسؤول [${name}] من شيت السجل؟`)) {
      const updatedList = officials.filter(o => o.id !== id);
      setOfficials(updatedList);
      saveStoredOfficials(updatedList);
    }
  };

  // Reset to default initial officials
  const handleResetToDefaults = () => {
    if (window.confirm('هل تريد إعادة تعيين الشيت إلى الكشف المؤسسي النموذجي الافتراضي لكافة مديريات محافظة إب؟')) {
      setOfficials(INITIAL_OFFICIALS);
      saveStoredOfficials(INITIAL_OFFICIALS);
    }
  };

  const getPermissionBadge = (level: string) => {
    switch (level) {
      case 'admin':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">قيادة عليا (Admin)</span>;
      case 'executive':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">تنفيذي (مدير عام)</span>;
      case 'supervisory':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">إشراف هندسي</span>;
      case 'field':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">ميداني / قطاع</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">مستعرض</span>;
    }
  };

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-2xl shadow-xl border border-slate-700 relative overflow-hidden print:border-none print:shadow-none print:bg-white print:text-black print:p-2">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-inner">
              <FileSpreadsheet className="w-7 h-7 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  شيت مؤسسي معتمد
                </span>
                <span className="text-xs text-slate-400">محافظة إب — 20 مديرية</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white mt-1">
                شيت أسماء وأرقام هواتف ومناطق صلاحيات مسؤولي المحافظة والمديريات
              </h1>
              <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl">
                السجل المرجعي المباشر للقيادات التنفيذية، مدراء عموم المديريات، مهندسي القطاعات، ورؤساء الجمعيات التعاونية مع بيان نطاق الصلاحيات الجغرافي وأرقام التواصل الفوري.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 print:hidden">
            <button
              onClick={() => setShowExcelImportModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs md:text-sm font-bold shadow-lg shadow-emerald-900/40 border border-emerald-400/30 transition active:scale-95 animate-pulse"
              title="استيراد شيت إكسل بأسماء وأرقام هواتف وصلاحيات المسؤولين مع إمكانية استبدال الشيت بالكامل"
            >
              <Upload className="w-4 h-4 text-emerald-200" />
              <span>استيراد شيت إكسل (Excel)</span>
            </button>

            <button
              onClick={() => {
                setEditingOfficial(null);
                setFormData({
                  fullName: '',
                  phone: '',
                  email: '',
                  jobTitle: '',
                  organization: 'وحدة التدخلات المركزية التنموية الطارئة',
                  governorate: 'محافظة إب',
                  district: 'مديرية ذي السفال',
                  scope: '',
                  role: 'مدير عام المديرية',
                  permissionLevel: 'executive',
                  accountStatus: 'linked_active'
                });
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs md:text-sm font-bold shadow border border-slate-600 transition active:scale-95"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              إضافة مسؤول يدوي
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs md:text-sm font-semibold border border-slate-600 shadow transition active:scale-95"
              title="تنزيل شيت بيانات المسؤولين بصيغة Excel / CSV"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              تصدير Excel
            </button>

            <button
              onClick={handleCopyAllContacts}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs md:text-sm font-semibold border border-slate-600 shadow transition active:scale-95"
              title="نسخ كشف المسؤولين والهواتف إلى الحافظة"
            >
              {copiedAll ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-300" />}
              {copiedAll ? 'تم النسخ!' : 'نسخ الكشف'}
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs md:text-sm font-semibold border border-slate-600 shadow transition active:scale-95"
              title="طباعة كشف شيت المسؤولين الرسمي"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              طباعة
            </button>

            <button
              onClick={handleResetToDefaults}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition"
              title="استعادة الشيت النموذجي الافتراضي"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-700/60 print:grid-cols-4 print:border-black">
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">إجمالي مسؤولي الشيت</p>
              <p className="text-lg font-bold text-white">{stats.total} مسؤول</p>
            </div>
            <UserCheck className="w-6 h-6 text-indigo-400 opacity-60" />
          </div>

          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">القيادات التنفيذية ومدراء المديريات</p>
              <p className="text-lg font-bold text-blue-400">{stats.executives} قيادي</p>
            </div>
            <Briefcase className="w-6 h-6 text-blue-400 opacity-60" />
          </div>

          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">مهندسو القطاعات والإشراف</p>
              <p className="text-lg font-bold text-emerald-400">{stats.engineers} مهندس</p>
            </div>
            <ShieldCheck className="w-6 h-6 text-emerald-400 opacity-60" />
          </div>

          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">المديريات المغطاة</p>
              <p className="text-lg font-bold text-purple-400">20 مديرية (100%)</p>
            </div>
            <MapPin className="w-6 h-6 text-purple-400 opacity-60" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 print:hidden">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم، رقم الهاتف، المديرية، منطقة الصلاحيات..."
            className="w-full pl-4 pr-10 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              مسح
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5">
            <MapPin className="w-4 h-4 text-indigo-600" />
            <select
              value={selectedDistrict}
              onChange={e => setSelectedDistrict(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">كافة المديريات (الكل)</option>
              {districtsList.map(d => (
                <option key={d} value={d}>
                  {d} ({initiativeCountByDistrict[d] || 0} مبادرة)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5">
            <Shield className="w-4 h-4 text-indigo-600" />
            <select
              value={selectedPermission}
              onChange={e => setSelectedPermission(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">كافة مستويات الصلاحية</option>
              <option value="admin">قيادة عليا (Admin)</option>
              <option value="executive">تنفيذي (مدير عام)</option>
              <option value="supervisory">إشراف هندسي</option>
              <option value="field">ميداني / قطاع</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 mr-auto font-medium">
            المطابق: <strong className="text-slate-800">{filteredOfficials.length}</strong> من أصل {officials.length}
          </div>
        </div>
      </div>

      {/* Main Sheet Table View */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <h2 className="font-bold text-slate-800 text-sm md:text-base">
              جدول شيت بيانات مسؤولي المديريات ومناطق ونطاقات الصلاحية
            </h2>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
            تحديث مباشر ومحمي
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs md:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-300 text-xs select-none">
                <th className="py-3.5 px-3 w-12 text-center border-l border-slate-200">م</th>
                <th className="py-3.5 px-4 min-w-[200px] border-l border-slate-200">اسم المسؤول والصفة</th>
                <th className="py-3.5 px-4 min-w-[170px] border-l border-slate-200">رقم الهاتف والتواصل</th>
                <th className="py-3.5 px-4 min-w-[240px] border-l border-slate-200 bg-indigo-50/50 text-indigo-950 font-extrabold">
                  منطقة ونطاق الصلاحيات الجغرافية
                </th>
                <th className="py-3.5 px-4 min-w-[140px] border-l border-slate-200">المديرية التابعة</th>
                <th className="py-3.5 px-4 min-w-[180px] border-l border-slate-200">المسمى الوظيفي والجهة</th>
                <th className="py-3.5 px-3 min-w-[120px] text-center border-l border-slate-200">مستوى الصلاحية</th>
                <th className="py-3.5 px-3 min-w-[90px] text-center border-l border-slate-200">المبادرات</th>
                <th className="py-3.5 px-3 min-w-[110px] text-center print:hidden">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredOfficials.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <p className="font-semibold text-base">لا توجد نتائج مطابقة لبحثك</p>
                    <p className="text-xs mt-1 text-slate-400">جرب تغيير كلمات البحث أو إعادة تعيين الفلاتر.</p>
                  </td>
                </tr>
              ) : (
                filteredOfficials.map((official, idx) => {
                  const initCount = initiativeCountByDistrict[official.district] || official.assignedInitiativeIds?.length || 0;
                  const isSuperAdmin = official.permissionLevel === 'admin';

                  return (
                    <tr
                      key={official.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSuperAdmin ? 'bg-amber-50/30' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                      }`}
                    >
                      {/* Sequence */}
                      <td className="py-3 px-3 text-center font-bold text-slate-500 border-l border-slate-200">
                        {idx + 1}
                      </td>

                      {/* Official Name */}
                      <td className="py-3 px-4 border-l border-slate-200">
                        <div className="flex items-start gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSuperAdmin
                              ? 'bg-amber-600 text-white shadow-sm'
                              : official.permissionLevel === 'executive'
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-700 text-white'
                          }`}>
                            {official.fullName.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                              {official.fullName}
                              {isSuperAdmin && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  مسؤول أعلى
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 font-medium mt-0.5">
                              {official.role}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phone & Contact Buttons */}
                      <td className="py-3 px-4 border-l border-slate-200">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-1 font-mono font-bold text-slate-800 dir-ltr text-right">
                            <span>{official.phone}</span>
                            <button
                              onClick={() => handleCopyPhone(official.phone, official.id)}
                              className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition"
                              title="نسخ رقم الهاتف"
                            >
                              {copiedId === official.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5 mt-0.5 print:hidden">
                            <a
                              href={`tel:${official.phone}`}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-xs font-semibold transition"
                              title={`اتصال هاتفي مباشر بالرقم ${official.phone}`}
                            >
                              <PhoneCall className="w-3 h-3 text-emerald-600" />
                              اتصال
                            </a>

                            <a
                              href={`https://wa.me/967${official.phone.replace(/^0+/, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded text-xs font-semibold transition"
                              title="مراسلة عبر واتساب"
                            >
                              <MessageSquare className="w-3 h-3 text-green-600" />
                              واتساب
                            </a>
                          </div>
                        </div>
                      </td>

                      {/* Jurisdiction / Geographical Scope (منطقة ونطاق الصلاحيات) */}
                      <td className="py-3 px-4 border-l border-slate-200 bg-indigo-50/30">
                        <div className="p-2 rounded-lg bg-white/80 border border-indigo-100 shadow-2xs">
                          <div className="flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                            <span className="font-semibold text-slate-800 text-xs leading-relaxed">
                              {official.scope || `نطاق اختصاص ${official.district}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* District */}
                      <td className="py-3 px-4 border-l border-slate-200">
                        <div className="font-bold text-slate-800">{official.district}</div>
                        <div className="text-[11px] text-slate-500">{official.governorate}</div>
                      </td>

                      {/* Job Title & Organization */}
                      <td className="py-3 px-4 border-l border-slate-200">
                        <div className="font-semibold text-slate-800">{official.jobTitle}</div>
                        <div className="text-[11px] text-slate-500 leading-tight mt-0.5 line-clamp-2">
                          {official.organization}
                        </div>
                      </td>

                      {/* Permission Level */}
                      <td className="py-3 px-3 text-center border-l border-slate-200">
                        {getPermissionBadge(official.permissionLevel)}
                      </td>

                      {/* Initiatives Count */}
                      <td className="py-3 px-3 text-center border-l border-slate-200 font-bold">
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-slate-100 text-slate-800 text-xs">
                          {initCount} مبادرة
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center print:hidden">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewingOfficial(official)}
                            className="p-1.5 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-lg transition"
                            title="عرض بطاقة المسؤول الكاملة"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setEditingOfficial(official);
                              setFormData({ ...official });
                              setShowAddModal(true);
                            }}
                            className="p-1.5 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg transition"
                            title="تعديل بيانات المسؤول ونطاق الصلاحيات"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {!isSuperAdmin && (
                            <button
                              onClick={() => handleDeleteOfficial(official.id, official.fullName)}
                              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                              title="حذف من الشيت"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>
              تم توثيق كافة بيانات مسؤولي المديريات وفق الهيكل التنظيمي المعتمد لوحدة التدخلات والسلطة المحلية بمحافظة إب.
            </span>
          </div>
          <div className="font-mono text-slate-500">
            إجمالي السجلات: {filteredOfficials.length}
          </div>
        </div>
      </div>

      {/* Add / Edit Official Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-2xl overflow-hidden my-8">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10 border border-white/20">
                  <UserCheck className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base md:text-lg">
                    {editingOfficial ? 'تعديل بيانات المسؤول ومنطقة الصلاحيات' : 'إضافة مسؤول جديد إلى الشيت'}
                  </h3>
                  <p className="text-xs text-slate-300">تسجيل وتوثيق نطاق الصلاحيات وأرقام التواصل الرسمية</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingOfficial(null);
                  setFormError(null);
                  setFormSuccess(null);
                }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOfficial} className="p-6 space-y-4">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الاسم الكامل للمسؤول <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName || ''}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="مثال: أ. محمد أحمد الشامي"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    رقم الهاتف الجوال <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone || ''}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="مثال: 777123456"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dir-ltr text-right"
                  />
                </div>

                {/* District */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المديرية التابعة <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.district || 'مديرية ذي السفال'}
                    onChange={e => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="كافة مديريات محافظة إب (20 مديرية)">كافة مديريات محافظة إب (20 مديرية)</option>
                    {districtsList.map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Permission Level */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    مستوى الصلاحية المؤسسية <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.permissionLevel || 'executive'}
                    onChange={e => setFormData({ ...formData, permissionLevel: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="executive">تنفيذي (مدير عام مديرية / قيادة)</option>
                    <option value="supervisory">إشراف هندسي ورقابة</option>
                    <option value="field">ميداني / مهندس قطاع / رئيس جمعية</option>
                    <option value="admin">قيادة عليا (Admin)</option>
                    <option value="viewer">مستعرض فقط</option>
                  </select>
                </div>

                {/* Job Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المسمى الوظيفي
                  </label>
                  <input
                    type="text"
                    value={formData.jobTitle || ''}
                    onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                    placeholder="مثال: مدير عام مديرية ذي السفال"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Organization */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الجهة أو الوحدة
                  </label>
                  <input
                    type="text"
                    value={formData.organization || ''}
                    onChange={e => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="مثال: السلطة المحلية بمديرية ذي السفال"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Geographical Jurisdiction Scope (منطقة الصلاحيات) */}
              <div>
                <label className="block text-xs font-bold text-indigo-900 mb-1">
                  منطقة ونطاق الصلاحيات الجغرافية (العزل / القرى / المسارات الميدانية)
                </label>
                <textarea
                  rows={2}
                  value={formData.scope || ''}
                  onChange={e => setFormData({ ...formData, scope: e.target.value })}
                  placeholder="مثال: نطاق مديرية ذي السفال (عزل: ريمان، حبير، وادي ضباء، الصفة، بني عبداله)..."
                  className="w-full px-3 py-2 text-sm border border-indigo-200 bg-indigo-50/40 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                ></textarea>
                <p className="text-[11px] text-slate-500 mt-1">
                  حدد العزل والمناطق الجغرافية التابعة لهذا المسؤول لربط القرارات والمطابقة الميدانية بدقة.
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  البريد الإلكتروني الرسمي (اختياري)
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@ebb.gov.ye"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dir-ltr text-right"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="px-6 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md transition"
                >
                  {editingOfficial ? 'حفظ التعديلات' : 'إضافة المسؤول للشيت'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Profile View Modal */}
      {viewingOfficial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-xl overflow-hidden my-8">
            <div className="p-6 bg-gradient-to-l from-slate-900 to-indigo-950 text-white relative">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/40 border border-indigo-400/40 flex items-center justify-center font-bold text-base text-white">
                    {viewingOfficial.fullName.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">{viewingOfficial.fullName}</h3>
                    <p className="text-xs text-indigo-300">{viewingOfficial.jobTitle}</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingOfficial(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs md:text-sm">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[11px]">رقم الهاتف:</span>
                  <span className="font-mono font-bold text-slate-800 dir-ltr block text-right">
                    {viewingOfficial.phone}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">المديرية:</span>
                  <span className="font-bold text-slate-800">{viewingOfficial.district}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">الجهة التابع لها:</span>
                  <span className="font-semibold text-slate-800">{viewingOfficial.organization}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">مستوى الصلاحية:</span>
                  <span className="font-semibold text-slate-800">{viewingOfficial.permissionLevel}</span>
                </div>
              </div>

              <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100">
                <h4 className="font-bold text-indigo-950 mb-1 flex items-center gap-1.5 text-xs">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  منطقة ونطاق الصلاحيات الجغرافية:
                </h4>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {viewingOfficial.scope || `نطاق اختصاص ${viewingOfficial.district}`}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <a
                  href={`tel:${viewingOfficial.phone}`}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  اتصال هاتفي
                </a>
                <a
                  href={`https://wa.me/967${viewingOfficial.phone.replace(/^0+/, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  مراسلة واتساب
                </a>
                <button
                  onClick={() => setViewingOfficial(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      {showExcelImportModal && (
        <OfficialsExcelImportModal
          isOpen={showExcelImportModal}
          onClose={() => setShowExcelImportModal(false)}
          currentOfficials={officials}
          onImportCompleted={(updatedList, summary) => {
            setOfficials(updatedList);
            alert(summary);
          }}
        />
      )}
    </div>
  );
}
