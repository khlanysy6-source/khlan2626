import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle, 
  Search, 
  Building, 
  Filter, 
  RefreshCw, 
  ArrowLeft, 
  Info,
  ChevronDown,
  HelpCircle,
  FileText,
  TrendingUp,
  MapPin,
  BarChart3,
  Layers
} from 'lucide-react';
import { Initiative, FieldReport, UserRole } from '../types';
import { parseNum } from '../utils/numberAndDistrictUtils';
import DevelopmentResultsMatrix from './DevelopmentResultsMatrix';

interface DeskReviewMatchingProps {
  initiatives: Initiative[];
  onUpdateInitiative: (updated: Initiative) => void;
  userRole: UserRole | 'admin' | 'visitor';
  targetInitiativeId?: string | null;
}

export default function DeskReviewMatching({ initiatives, onUpdateInitiative, userRole, targetInitiativeId }: DeskReviewMatchingProps) {
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'discrepancies'>('matrix');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all'); // all, matched, discrepancy, pending_audit
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null);
  const [alertModalInitiative, setAlertModalInitiative] = useState<any | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (targetInitiativeId) {
      const found = initiatives.find(i => i.id === targetInitiativeId);
      if (found) {
        setSearchTerm(found.name);
      }
    }
  }, [targetInitiativeId, initiatives]);

  // Extract unique districts
  const districts = useMemo(() => {
    const set = new Set<string>();
    initiatives.forEach(init => {
      if (init.district) set.add(init.district);
    });
    return Array.from(set);
  }, [initiatives]);

  // Compute matching data and details for each initiative
  const auditedInitiatives = useMemo(() => {
    return initiatives.map(init => {
      // An initiative is matched if it has at least one report that isMatchedWithDeskReview === true
      const hasMatchedReport = init.reports?.some(r => r.isMatchedWithDeskReview) || false;
      
      // Auto-detect discrepancies and alerts
      const discrepancies: string[] = [];
      
      // Parse Cement values according to user definitions:
      // المعتمد = إجمالي ما تم اعتماده للمبادرة من الوحدة
      // المنصرف = ما تم صرفه من الوحدة للمبادرة
      // المستخدم = ما قامت المبادرة باستخدامه فعلياً
      // المتبقي لدى الوحدة كالتزام لم يصرف بعد = المعتمد - المنصرف
      // المخزون بموقع العمل لدى المبادرة = المنصرف - المستخدم
      const cementApprovedNum = parseNum(init.materialsApproved);
      const cementDisbursedNum = parseNum(init.materialsDisbursed);
      const cementUsedNum = parseNum(init.materialsUsed);
      const cementUnitRemaining = Math.max(0, cementApprovedNum - cementDisbursedNum);
      const cementSiteStock = Math.max(0, cementDisbursedNum - cementUsedNum);

      // Parse Diesel values
      const dieselApprovedNum = parseNum(init.dieselApproved);
      const dieselDisbursedNum = parseNum(init.dieselDisbursed);
      const dieselUsedNum = parseNum(init.dieselUsed);
      const dieselUnitRemaining = Math.max(0, dieselApprovedNum - dieselDisbursedNum);
      const dieselSiteStock = Math.max(0, dieselDisbursedNum - dieselUsedNum);

      // Check 1: Cement site stock remaining in stagnant or stopped initiative (HIGH RISK OF SPOILAGE)
      if (cementSiteStock > 0 && (init.status === 'stagnant' || init.status === 'stopped')) {
        discrepancies.push(`⚠️ تنبيه حرج (مخزون موقع العمل): يوجد مخزون أسمنت مُسلّم بموقع العمل قدره (${cementSiteStock.toLocaleString()} كيس) والمبادرة في حالة (${init.status === 'stagnant' ? 'تعثر' : 'توقف'}). هناك خطر داهم بتلف وتكتل الإسمنت. يوصى بمناقلته أو تسريع الصب فوراً!`);
      }

      // Check 2: Diesel site stock remaining in stagnant or stopped initiative
      if (dieselSiteStock > 0 && (init.status === 'stagnant' || init.status === 'stopped')) {
        discrepancies.push(`⚠️ تنبيه حرج (مخزون الديزل بالموقع): متبقي لدى المبادرة بموقع العمل كمية ديزل قدرها (${dieselSiteStock.toLocaleString()} لتر) والمبادرة متوقفة/متعثرة. يوصى بنقل الديزل لمعدة تعمل بمبادرة مجاورة.`);
      }

      // Check 3: Cement site stock remaining when initiative is completed
      if (cementSiteStock > 0 && (init.status === 'completed' || init.completionRate === 100)) {
        discrepancies.push(`📢 فائض أسمنت بموقع العمل: المبادرة مكتملة بنسبة 100% ويوجد فائض أسمنت بموقع العمل قدره (${cementSiteStock.toLocaleString()} كيس). يلزم تحرير محضر مناقلة للكمية الفائضة لصالح مبادرة أخرى.`);
      }

      // Check 4: Cement unit commitment remaining when initiative is completed
      if (cementUnitRemaining > 0 && (init.status === 'completed' || init.completionRate === 100)) {
        discrepancies.push(`📢 فائض اعتماد لدى الوحدة: المبادرة مكتملة بنسبة 100% وتوجد حصة معتمدة متبقية لدى الوحدة قدرها (${cementUnitRemaining.toLocaleString()} كيس) لم تصرف بعد. يلزم إلغاء أو توجيه الاعتماد المتبقي لمبادرة أخرى.`);
      }

      // Check 5: Disbursed exceeds Approved
      if (cementDisbursedNum > cementApprovedNum && cementApprovedNum > 0) {
        discrepancies.push(`❌ تجاوز صرف الإسمنت: الإسمنت المنصرف (${cementDisbursedNum.toLocaleString()} كيس) أكبر من الاعتماد المعتمد (${cementApprovedNum.toLocaleString()} كيس) بمقدار (${(cementDisbursedNum - cementApprovedNum).toLocaleString()} كيس).`);
      }

      // Check 6: Used exceeds Disbursed
      if (cementUsedNum > cementDisbursedNum && cementDisbursedNum > 0) {
        discrepancies.push(`❌ تجاوز استهلاك الإسمنت: الإسمنت المستخدم (${cementUsedNum.toLocaleString()} كيس) أكبر من الإسمنت المنصرف والمستلم بالموقع (${cementDisbursedNum.toLocaleString()} كيس).`);
      }

      // Check 7: Diesel disbursed exceeds approved
      if (dieselDisbursedNum > dieselApprovedNum && dieselApprovedNum > 0) {
        discrepancies.push(`❌ تجاوز صرف الديزل: الديزل المنصرف (${dieselDisbursedNum.toLocaleString()} لتر) أكبر من المعتمد (${dieselApprovedNum.toLocaleString()} لتر).`);
      }

      // Check 8: Completion rate mismatch
      if (init.status === 'completed' && init.completionRate < 100) {
        discrepancies.push('حالة المبادرة مكتملة بينما نسبة الإنجاز المسجلة أقل من 100%');
      }

      // Check 9: Completion without reports
      if (init.completionRate > 50 && (!init.reports || init.reports.length === 0)) {
        discrepancies.push('المبادرة تجاوزت نسبة إنجاز 50% دون وجود أي تقرير رقابة ميداني موثق');
      }

      // Check 10: Stagnation with no reason
      if ((init.status === 'stagnant' || init.status === 'stopped') && !init.stagnationReason) {
        discrepancies.push('المبادرة مسجلة كمتعثرة/متوقفة دون تحديد أو توثيق الأسباب الفنية للتعثر');
      }

      // Check 11: Auto Comparison between Sheet 3 (Technical Study) and Sheet 2 (Executed)
      const approvedQuantities = init.approvedStudyQuantities || {};
      const executedQuantities = init.executedWorkQuantities || {};
      
      if (approvedQuantities.lengthCompleted && executedQuantities.lengthCompleted && approvedQuantities.lengthCompleted !== executedQuantities.lengthCompleted) {
        const lenDiff = executedQuantities.lengthCompleted - approvedQuantities.lengthCompleted;
        discrepancies.push(`📐 فارق كميات الطول الفني (الشيت 3 الدراسات vs المنفذ): المعتمد بالدراسة (${approvedQuantities.lengthCompleted.toLocaleString()}م) مقابل المنفذ ميدانياً (${executedQuantities.lengthCompleted.toLocaleString()}م) - الفارق: (${lenDiff > 0 ? '+' : ''}${lenDiff.toLocaleString()}م).`);
      }

      if (approvedQuantities.avgWidth && executedQuantities.avgWidth && approvedQuantities.avgWidth !== executedQuantities.avgWidth) {
        discrepancies.push(`📏 فارق عرض الطريق: المعتمد بالدراسة (${approvedQuantities.avgWidth}م) مقابل المنفذ (${executedQuantities.avgWidth}م).`);
      }

      if (approvedQuantities.stonePaving && executedQuantities.stonePaving && approvedQuantities.stonePaving !== executedQuantities.stonePaving) {
        const pavingDiff = executedQuantities.stonePaving - approvedQuantities.stonePaving;
        discrepancies.push(`🧱 فارق الرصف الحجري: المعتمد بالدراسة (${approvedQuantities.stonePaving.toLocaleString()}) مقابل المنفذ (${executedQuantities.stonePaving.toLocaleString()}) - الفارق: (${pavingDiff > 0 ? '+' : ''}${pavingDiff.toLocaleString()}).`);
      }

      const studyCostVal = init.cost || 0;
      const executedCostVal = init.executionCostCompleted || 0;
      if (studyCostVal > 0 && executedCostVal > 0 && Math.abs(studyCostVal - executedCostVal) > 1000) {
        const costDiff = executedCostVal - studyCostVal;
        discrepancies.push(`💰 فارق التكلفة (الدراسة vs المنفذ): التقديري بالدراسة (${studyCostVal.toLocaleString('ar-YE')} ر.ي) مقابل تكلفة المنجز الميداني (${executedCostVal.toLocaleString('ar-YE')} ر.ي) - الفارق: (${costDiff > 0 ? '+' : ''}${costDiff.toLocaleString('ar-YE')} ر.ي).`);
      }

      let matchStatus: 'matched' | 'discrepancy' | 'pending_audit' = 'pending_audit';
      if (hasMatchedReport && discrepancies.length === 0) {
        matchStatus = 'matched';
      } else if (discrepancies.length > 0) {
        matchStatus = 'discrepancy';
      }

      return {
        ...init,
        cementApprovedNum,
        cementDisbursedNum,
        cementUsedNum,
        cementUnitRemaining,
        cementSiteStock,
        dieselApprovedNum,
        dieselDisbursedNum,
        dieselUsedNum,
        dieselUnitRemaining,
        dieselSiteStock,
        hasMatchedReport,
        discrepancies,
        matchStatus
      };
    });
  }, [initiatives]);

  // Filter list
  const filteredList = useMemo(() => {
    return auditedInitiatives.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.initiativeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (item.subDistrict && item.subDistrict.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesDistrict = selectedDistrict === 'all' || item.district === selectedDistrict;
      const matchesStatus = selectedStatus === 'all' || item.matchStatus === selectedStatus;
      return matchesSearch && matchesDistrict && matchesStatus;
    });
  }, [auditedInitiatives, searchTerm, selectedDistrict, selectedStatus]);

  // General metrics
  const metrics = useMemo(() => {
    const total = auditedInitiatives.length;
    const matched = auditedInitiatives.filter(i => i.matchStatus === 'matched').length;
    const discrepancies = auditedInitiatives.filter(i => i.matchStatus === 'discrepancy').length;
    const pending = auditedInitiatives.filter(i => i.matchStatus === 'pending_audit').length;
    const rate = total > 0 ? Math.round((matched / total) * 100) : 0;

    return { total, matched, discrepancies, pending, rate };
  }, [auditedInitiatives]);

  // Handle setting/reconciling an initiative
  const handleQuickReconcile = (initId: string) => {
    const original = initiatives.find(i => i.id === initId);
    if (!original) return;

    // Create a matching report
    const newReport: FieldReport = {
      id: `rep_match_${String(Date.now())}`,
      title: 'تقرير مطابقة فنية وتقييم مكتبي معتمد',
      date: new Date().toISOString().split('T')[0],
      description: 'تم النزول والتحقق المكتبي والميداني من سلامة المبادرة ومطابقة كافة القيود والمواد ومستوى الإنجاز وتصنيف المنجزات آلياً.',
      isMatchedWithDeskReview: true,
      status: 'approved',
      achievements: ['تم مطابقة القيود الفنية والمستندات', 'التحقق التام من حماية الإسمنت المخزن ومناقلة الفائض بكفاءة'],
      challenges: [],
      imagePlaceholder: 'infrastructure'
    };

    const updatedReports = [...(original.reports || []), newReport];
    const updatedInitiative: Initiative = {
      ...original,
      reports: updatedReports,
      // Ensure data is mathematically aligned if there were discrepancies
      completionRate: original.status === 'completed' ? 100 : original.completionRate,
      updatedAt: new Date().toISOString()
    };

    onUpdateInitiative(updatedInitiative);
    
    // Update local preview state
    if (selectedInitiative?.id === initId) {
      setSelectedInitiative(updatedInitiative);
    }

    setSuccessMessage('تم تثبيت المطابقة وتسجيل تقرير التحقق الميداني والفرز المكتبي بنجاح!');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-xs p-6 space-y-6 text-right" dir="rtl">
      {/* Header Banner */}
      <div className="relative bg-slate-950 text-white rounded-2xl p-6 overflow-hidden shadow-md">
        <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              الفرز المكتبي والتحقق الذكي لمحافظة إب
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              نتائج المطابقة والمكاشفة التنموية 🔎
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              تقوم هذه الصفحة المستقلة بمطابقة حية وتلقائية للبيانات المرفوعة من الميدان مع سجلات المكاتب والتقارير الفنية، بهدف الكشف عن أي انحراف في تتبع المواد، ونسب الإنجاز، ومناقلات الإسمنت والمحروقات.
            </p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
            <div className="text-left">
              <div className="text-[24px] font-black text-emerald-400">{metrics.rate}%</div>
              <div className="text-[9px] text-slate-400 font-bold">معدل التطابق والمطابقة الفنية العام</div>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Gateway Sub-Tab Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveSubTab('matrix')}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeSubTab === 'matrix'
              ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-500/20'
              : 'text-slate-700 hover:bg-slate-200/80 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-emerald-300" />
          <span>مصفوفة النتائج التنموية ومطابقة الكميات (Development Results Matrix) 📊</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('discrepancies')}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeSubTab === 'discrepancies'
              ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-500/20'
              : 'text-slate-700 hover:bg-slate-200/80 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-300" />
          <span>سجل الفرز المكتبي وتنبيهات المطابقة الميدانية 🔎</span>
        </button>
      </div>

      {/* Conditional Sub-Tab View Rendering */}
      {activeSubTab === 'matrix' ? (
        <DevelopmentResultsMatrix 
          initiatives={initiatives} 
          onSelectInitiative={(init) => {
            setSelectedInitiative(init);
            setActiveSubTab('discrepancies');
          }} 
        />
      ) : (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold block">إجمالي المبادرات المفروزة</span>
            <span className="text-xl font-black text-slate-900">{metrics.total}</span>
          </div>
          <div className="p-3 bg-slate-200/50 text-slate-700 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-emerald-700 font-bold block">مطابقة بالكامل ومحققة</span>
            <span className="text-xl font-black text-emerald-800">{metrics.matched}</span>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-rose-700 font-bold block">مبادرات بها فجوات/ملاحظات</span>
            <span className="text-xl font-black text-rose-800">{metrics.discrepancies}</span>
          </div>
          <div className="p-3 bg-rose-100 text-rose-700 rounded-xl">
            <AlertCircle className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-amber-700 font-bold block">معلقة بانتظار التحقق والمطابقة</span>
            <span className="text-xl font-black text-amber-800">{metrics.pending}</span>
          </div>
          <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
            <RefreshCw className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-50/50 border border-slate-200/60 p-4 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="البحث برقم المبادرة، الاسم، أو عزلة المبادرة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 placeholder-slate-400"
            />
          </div>

          {/* District Filter */}
          <div className="w-full md:w-[220px]">
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-indigo-500"
            >
              <option value="all">كافة المديريات ({districts.length})</option>
              {districts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Matching Status Filter */}
          <div className="w-full md:w-[220px]">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-indigo-500"
            >
              <option value="all">كافة حالات المطابقة</option>
              <option value="matched">مطابق بالكامل وموثق فصلياً (الأخضر)</option>
              <option value="discrepancy">يحتوي ملاحظات/فجوات فنية (الأحمر)</option>
              <option value="pending_audit">قيد التدقيق والفرز المكتبي (الرمادي)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Success Notifications */}
      {successMessage && (
        <div className="bg-emerald-500 text-white p-3 rounded-xl text-xs font-bold shadow-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Results Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Initiatives list */}
        <div className={`lg:col-span-8 space-y-3 ${selectedInitiative ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          <div className="text-xs font-black text-slate-500 pb-1 flex justify-between items-center px-1">
            <span>قائمة الفرز والمطابقة للمبادرات ({filteredList.length})</span>
            {selectedDistrict !== 'all' && <span className="bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-lg text-[10px] font-bold">{selectedDistrict}</span>}
          </div>

          <div className="max-h-[600px] overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
            {filteredList.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-black text-slate-500">لا توجد مبادرات مطابقة للفلاتر أو خيارات البحث الحالية.</p>
              </div>
            ) : (
              filteredList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedInitiative(item)}
                  className={`border text-right p-4 rounded-xl transition-all cursor-pointer relative overflow-hidden bg-white ${
                    selectedInitiative?.id === item.id 
                      ? 'border-indigo-600 ring-2 ring-indigo-500/10 shadow-3xs' 
                      : 'border-slate-200/80 hover:border-slate-300 shadow-4xs'
                  }`}
                >
                  {/* Status Indicator Bar */}
                  <div className={`absolute top-0 right-0 bottom-0 w-1.5 ${
                    item.matchStatus === 'matched' ? 'bg-emerald-500' :
                    item.matchStatus === 'discrepancy' ? 'bg-rose-500' : 'bg-slate-300'
                  }`}></div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700">
                          {item.initiativeNumber}
                        </span>
                        <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          {item.name}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-semibold flex-wrap">
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3 text-slate-400" />
                          {item.district}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {item.subDistrict} - {item.village}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {/* Completion rate badge */}
                      <div className="text-left pl-2 border-l border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">الإنجاز الفعلي</span>
                        <span className="text-xs font-black text-slate-800">{item.completionRate}%</span>
                      </div>

                      {/* Matching Status Badge / Alerts Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInitiative(item);
                          setAlertModalInitiative(item);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black cursor-pointer transition-all shadow-xs ${
                          item.matchStatus === 'matched' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' :
                          item.matchStatus === 'discrepancy' 
                            ? 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200 hover:scale-105 animate-pulse' : 
                            'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                        }`}
                        title="اضغط هنا لعرض التنبيهات والفجوات الميدانية فوراً ⚠️"
                      >
                        {item.matchStatus === 'matched' ? 'مطابق بالكامل 🔐' :
                         item.matchStatus === 'discrepancy' ? `⚠️ ${item.discrepancies.length} تنبيهات (عرض الكشف 🔍)` : 
                         'قيد التحقق والمطابقة 🔎'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Initiative Matching Detail Drawer */}
        {selectedInitiative && (
          <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-4 self-start animate-fadeIn">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-200">
              <h3 className="font-extrabold text-slate-950 text-xs sm:text-sm">
                تفاصيل الفرز والتحقق والمطابقة
              </h3>
              <button 
                onClick={() => setSelectedInitiative(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-justify leading-relaxed">
              <div>
                <span className="text-[9px] text-slate-400 font-bold">اسم المبادرة المستهدفة</span>
                <p className="font-extrabold text-slate-900 leading-normal">{selectedInitiative.name}</p>
              </div>

              {/* Status Indicator Panel */}
              <div className={`p-3 rounded-xl border ${
                selectedInitiative.matchStatus === 'matched' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-950' :
                selectedInitiative.matchStatus === 'discrepancy' ? 'bg-rose-50/50 border-rose-100 text-rose-950' : 
                'bg-slate-100/50 border-slate-200 text-slate-800'
              }`}>
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  {selectedInitiative.matchStatus === 'matched' ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>المبادرة مطابقة لشهادات الإنجاز الفعلي</span>
                    </>
                  ) : selectedInitiative.matchStatus === 'discrepancy' ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 animate-pulse" />
                      <span>تم الكشف عن فجوات ومخالفات قيود</span>
                    </>
                  ) : (
                    <>
                      <Info className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>التحقق معلق بانتظار إفادة الفرسان</span>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-slate-600 leading-snug">
                  {selectedInitiative.matchStatus === 'matched' 
                    ? 'كافة كشوف المشتريات ومناقلات المواد وسجلات رصد الإسمنت مطابقة تماماً للميدان دون أي اختلافات تذكر.'
                    : selectedInitiative.matchStatus === 'discrepancy'
                    ? 'المنظومة رصدت عدم توافق في سجلات هذه المبادرة. يوصى بمراجعة المندوب المحلي وممثلي لجان التفعيل فوراً.'
                    : 'لم يكتمل بعد الفرز المستندي الفني المكتبي لهذه المبادرة، أو لا يزال التقرير الميداني معلقاً كمسودة.'}
                </p>
              </div>

              {/* Discrepancies list */}
              {selectedInitiative.discrepancies && selectedInitiative.discrepancies.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[9.5px] font-black text-rose-700 block">فجوات المطابقة المكتشفة ({selectedInitiative.discrepancies.length}):</span>
                  <ul className="space-y-1.5 pl-1 pr-1 list-disc list-inside text-rose-900 bg-rose-50/20 p-2.5 rounded-xl border border-rose-100/40 text-[10px]">
                    {selectedInitiative.discrepancies.map((disc, idx) => (
                      <li key={idx} className="leading-relaxed font-semibold">
                        {disc}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Cement & Diesel Reconciliation Ledger */}
              <div className="bg-slate-900 text-white border border-slate-800 rounded-xl p-3 space-y-2 text-[10px]">
                <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                  <span className="font-black text-amber-400 block">سجل الالتزامات والمواد (إسمنت وديزل):</span>
                  <span className="text-[9px] text-slate-400">مساهمة وحدة التدخلات</span>
                </div>

                <div className="space-y-2 pt-1 font-mono">
                  {/* Cement Table */}
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-[9px] font-sans font-bold text-sky-400 block mb-1">🏗️ الإسمنت (بالكيس):</span>
                    <div className="grid grid-cols-5 gap-1 text-center text-[8.5px]">
                      <div>
                        <span className="text-slate-500 block">المعتمد</span>
                        <strong className="text-slate-200">{Number(selectedInitiative.materialsApproved || 0).toLocaleString()}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">المنصرف</span>
                        <strong className="text-sky-400">{Number(selectedInitiative.materialsDisbursed || 0).toLocaleString()}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">المستخدم</span>
                        <strong className="text-emerald-400">{Number(selectedInitiative.materialsUsed || 0).toLocaleString()}</strong>
                      </div>
                      <div>
                        <span className="text-amber-400/80 block" title="المعتمد - المنصرف">متبقي بالوحدة</span>
                        <strong className="text-amber-300 font-bold">
                          {Math.max(0, Number(selectedInitiative.materialsApproved || 0) - Number(selectedInitiative.materialsDisbursed || 0)).toLocaleString()}
                        </strong>
                      </div>
                      <div>
                        <span className="text-rose-400/80 block" title="المنصرف - المستخدم">مخزون الموقع</span>
                        <strong className={Math.max(0, Number(selectedInitiative.materialsDisbursed || 0) - Number(selectedInitiative.materialsUsed || 0)) > 0 ? "text-rose-400 font-black" : "text-slate-400"}>
                          {Math.max(0, Number(selectedInitiative.materialsDisbursed || 0) - Number(selectedInitiative.materialsUsed || 0)).toLocaleString()}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Diesel Table */}
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-[9px] font-sans font-bold text-amber-400 block mb-1">⛽ الديزل للمعدات (باللتر):</span>
                    <div className="grid grid-cols-5 gap-1 text-center text-[8.5px]">
                      <div>
                        <span className="text-slate-500 block">المعتمد</span>
                        <strong className="text-slate-200">{Number(selectedInitiative.dieselApproved || 0).toLocaleString()}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">المنصرف</span>
                        <strong className="text-amber-400">{Number(selectedInitiative.dieselDisbursed || 0).toLocaleString()}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">المستهلك</span>
                        <strong className="text-emerald-400">{Number(selectedInitiative.dieselUsed || 0).toLocaleString()}</strong>
                      </div>
                      <div>
                        <span className="text-amber-400/80 block" title="المعتمد - المنصرف">متبقي بالوحدة</span>
                        <strong className="text-amber-300 font-bold">
                          {Math.max(0, Number(selectedInitiative.dieselApproved || 0) - Number(selectedInitiative.dieselDisbursed || 0)).toLocaleString()}
                        </strong>
                      </div>
                      <div>
                        <span className="text-rose-400/80 block" title="المنصرف - المستهلك">مخزون الموقع</span>
                        <strong className={Math.max(0, Number(selectedInitiative.dieselDisbursed || 0) - Number(selectedInitiative.dieselUsed || 0)) > 0 ? "text-rose-400 font-black" : "text-slate-400"}>
                          {Math.max(0, Number(selectedInitiative.dieselDisbursed || 0) - Number(selectedInitiative.dieselUsed || 0)).toLocaleString()}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Study vs Executed Comparison Table */}
              <StudyVsExecutedComparisonTable initiative={selectedInitiative} />

              {/* Financial comparison audit */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5 text-[10px]">
                <span className="font-extrabold text-slate-800 block">تدقيق موازنة المبادرة (ريال يمني):</span>
                
                <div className="grid grid-cols-2 gap-2 border-b border-slate-100 pb-2">
                  <div>
                    <span className="text-slate-400 block text-[9px]">التكلفة الإجمالية</span>
                    <strong className="font-bold text-slate-800">{(selectedInitiative.cost || 0).toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">المساهمة المجتمعية</span>
                    <strong className="font-bold text-emerald-700">{(selectedInitiative.communityContribution || 0).toLocaleString()}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[9px]">مساهمة وحدة التدخلات</span>
                    <strong className="font-bold text-indigo-700">{(selectedInitiative.unitContribution || 0).toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">معدل المساهمة الأهلية</span>
                    <strong className="font-bold text-slate-800">
                      {selectedInitiative.cost > 0 
                        ? Math.round((selectedInitiative.communityContribution / selectedInitiative.cost) * 100) 
                        : 0}%
                    </strong>
                  </div>
                </div>
              </div>

              {/* Action area for admins */}
              {userRole === 'admin' ? (
                <div className="pt-3 border-t border-slate-200">
                  <button
                    onClick={() => handleQuickReconcile(selectedInitiative.id)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    تثبيت وتصفير فجوات المطابقة مكتبياً 🔐
                  </button>
                  <span className="block text-[8px] text-slate-400 text-center mt-1">
                    سيقوم هذا الإجراء بمطابقة الكميات والمواد وتثبيتها كتقرير معتمد للمديرية.
                  </span>
                </div>
              ) : (
                <div className="bg-amber-50/50 border border-amber-100 p-2 rounded-xl text-[9px] text-amber-800 text-justify">
                  💡 تصفير فجوات المطابقة وتثبيت التقارير مكتبياً يتطلب تسجيل الدخول بصلاحية مسؤول المتابعة والإشراف (م. عيسى القادري).
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ALERT & DISCREPANCY DETAILED MODAL POPUP */}
      {alertModalInitiative && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setAlertModalInitiative(null)}
        >
          <div 
            className="bg-white border border-slate-200 text-slate-900 rounded-3xl p-5 sm:p-6 max-w-2xl w-full space-y-5 shadow-2xl relative text-right max-h-[90vh] overflow-y-auto scrollbar-thin"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  كشف التنبيهات والفجوات الميدانية للمطابقة الفنية
                </span>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  {alertModalInitiative.name}
                </h3>
              </div>
              <button
                onClick={() => setAlertModalInitiative(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-600 text-slate-500 hover:text-white flex items-center justify-center font-bold text-xs transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Summary Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">رقم المبادرة</span>
                <strong className="font-extrabold text-slate-800">{alertModalInitiative.initiativeNumber}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">المديرية</span>
                <strong className="font-extrabold text-slate-800">{alertModalInitiative.district}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">حالة العمل</span>
                <strong className={`font-extrabold ${
                  alertModalInitiative.status === 'completed' ? 'text-emerald-700' :
                  alertModalInitiative.status === 'stagnant' || alertModalInitiative.status === 'stopped' ? 'text-rose-700' : 'text-amber-700'
                }`}>
                  {alertModalInitiative.status === 'completed' ? 'مكتملة' :
                   alertModalInitiative.status === 'stagnant' ? 'متعثرة' :
                   alertModalInitiative.status === 'stopped' ? 'متوقفة' : 'قيد التنفيذ'}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">نسبة الإنجاز</span>
                <strong className="font-black text-indigo-700">{alertModalInitiative.completionRate}%</strong>
              </div>
            </div>

            {/* Alert / Discrepancies List */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black text-rose-800 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>التنبيهات الفنية والملاحظات المرصودة آلياً ({alertModalInitiative.discrepancies?.length || 0}):</span>
              </h4>

              {alertModalInitiative.discrepancies && alertModalInitiative.discrepancies.length > 0 ? (
                <div className="space-y-2">
                  {alertModalInitiative.discrepancies.map((disc: string, idx: number) => (
                    <div 
                      key={idx} 
                      className="bg-rose-50/80 border border-rose-200/90 text-rose-950 p-3 rounded-2xl text-xs font-bold leading-relaxed flex items-start gap-2.5 shadow-2xs"
                    >
                      <span className="text-rose-600 font-black shrink-0 text-sm">{idx + 1}.</span>
                      <p>{disc}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>لا توجد أي تنبيهات أو فجوات مرصودة لهذه المبادرة! القيود والمواد ومعدلات الإنجاز مطابقة بالكامل.</span>
                </div>
              )}
            </div>

            {/* Material Ledger Breakdown Table explaining domain logic */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-black text-slate-800 flex items-center justify-between">
                <span>سجل مواد المبادرة (الإسمنت والديزل):</span>
                <span className="text-[10px] font-normal text-slate-500">حسب المعايير والقيود المعتمدة</span>
              </h4>

              <div className="bg-slate-900 text-white rounded-2xl p-3.5 space-y-3 text-xs">
                {/* Formulas Explanatory Note */}
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-[10.5px] text-slate-300 leading-relaxed font-sans space-y-1">
                  <p className="font-bold text-amber-300">💡 بيان قيود حركة المواد والالتزامات:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-300">
                    <li><strong className="text-white">المعتمد:</strong> الحصة الإجمالية المعتمدة للمبادرة من قِبَل الوحدة.</li>
                    <li><strong className="text-sky-300">المنصرف:</strong> الكمية المنصرفة والمستلمة فعلياً بموقع المبادرة.</li>
                    <li><strong className="text-emerald-300">المستخدم:</strong> الكمية المستهلكة في صب وتنفيذ المبادرة.</li>
                    <li><strong className="text-amber-300">المتبقي بالوحدة (التزام لم يصرف):</strong> الفارق بين المعتمد والمنصرف (<span className="font-mono text-amber-200">المعتمد - المنصرف</span>).</li>
                    <li><strong className="text-rose-300">المخزون بموقع العمل:</strong> الفارق بين المنصرف والمستخدم (<span className="font-mono text-rose-200">المنصرف - المستخدم</span>).</li>
                  </ul>
                </div>

                {/* Detailed Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-center text-[11px] font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] font-sans text-slate-400">
                        <th className="py-1.5 px-2 text-right">المادة</th>
                        <th className="py-1.5 px-1">المعتمد</th>
                        <th className="py-1.5 px-1 text-sky-400">المنصرف</th>
                        <th className="py-1.5 px-1 text-emerald-400">المستخدم</th>
                        <th className="py-1.5 px-1 text-amber-400">متبقي بالوحدة</th>
                        <th className="py-1.5 px-1 text-rose-400">مخزون الموقع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {/* Cement Row */}
                      <tr>
                        <td className="py-2 px-2 text-right font-sans font-bold text-slate-200">🏗️ الإسمنت (كيس)</td>
                        <td className="py-2 px-1 text-slate-300">{Number(alertModalInitiative.materialsApproved || 0).toLocaleString()}</td>
                        <td className="py-2 px-1 text-sky-300 font-bold">{Number(alertModalInitiative.materialsDisbursed || 0).toLocaleString()}</td>
                        <td className="py-2 px-1 text-emerald-300 font-bold">{Number(alertModalInitiative.materialsUsed || 0).toLocaleString()}</td>
                        <td className="py-2 px-1 text-amber-300 font-black">
                          {Math.max(0, Number(alertModalInitiative.materialsApproved || 0) - Number(alertModalInitiative.materialsDisbursed || 0)).toLocaleString()}
                        </td>
                        <td className="py-2 px-1 font-black text-rose-400">
                          {Math.max(0, Number(alertModalInitiative.materialsDisbursed || 0) - Number(alertModalInitiative.materialsUsed || 0)).toLocaleString()}
                        </td>
                      </tr>
                      {/* Diesel Row */}
                      <tr>
                        <td className="py-2 px-2 text-right font-sans font-bold text-slate-200">⛽ الديزل (لتر)</td>
                        <td className="py-2 px-1 text-slate-300">{Number(alertModalInitiative.dieselApproved || 0).toLocaleString()}</td>
                        <td className="py-2 px-1 text-amber-300 font-bold">{Number(alertModalInitiative.dieselDisbursed || 0).toLocaleString()}</td>
                        <td className="py-2 px-1 text-emerald-300 font-bold">{Number(alertModalInitiative.dieselUsed || 0).toLocaleString()}</td>
                        <td className="py-2 px-1 text-amber-300 font-black">
                          {Math.max(0, Number(alertModalInitiative.dieselApproved || 0) - Number(alertModalInitiative.dieselDisbursed || 0)).toLocaleString()}
                        </td>
                        <td className="py-2 px-1 font-black text-rose-400">
                          {Math.max(0, Number(alertModalInitiative.dieselDisbursed || 0) - Number(alertModalInitiative.dieselUsed || 0)).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Study vs Executed Technical Quantities Comparison Table */}
            <StudyVsExecutedComparisonTable initiative={alertModalInitiative} />

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {userRole === 'admin' ? (
                <button
                  onClick={() => {
                    handleQuickReconcile(alertModalInitiative.id);
                    setAlertModalInitiative(null);
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>تثبيت وتصفير التنبيهات مكتبياً 🔐</span>
                </button>
              ) : (
                <span className="text-[10px] text-slate-500 font-bold">
                  سجل العرض والتدقيق الفني
                </span>
              )}

              <button
                onClick={() => setAlertModalInitiative(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs rounded-xl cursor-pointer transition-all"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

function StudyVsExecutedComparisonTable({ initiative }: { initiative: any }) {
  if (!initiative) return null;
  const approved = initiative.approvedStudyQuantities || {};
  const executed = initiative.executedWorkQuantities || {};
  const approvedCost = initiative.cost || 0;
  const executedCost = initiative.executionCostCompleted || 0;

  const items = [
    {
      label: 'التكلفة الإجمالية (ريال يمني)',
      approvedVal: approvedCost,
      executedVal: executedCost,
      unit: 'ر.ي'
    },
    {
      label: 'متوسط عرض الطريق',
      approvedVal: approved.avgWidth || 0,
      executedVal: executed.avgWidth || 0,
      unit: 'م'
    },
    {
      label: 'الطول الفني الإجمالي المنجز',
      approvedVal: approved.lengthCompleted || 0,
      executedVal: executed.lengthCompleted || 0,
      unit: 'م'
    },
    {
      label: 'أعمال الشق والتوسعة',
      approvedVal: (approved.excavationCut || 0) + (approved.expansion || 0),
      executedVal: (executed.excavationCut || 0) + (executed.expansion || 0),
      unit: ''
    },
    {
      label: 'أعمال المسح والتسوية',
      approvedVal: approved.gradingLevelling || 0,
      executedVal: executed.gradingLevelling || 0,
      unit: ''
    },
    {
      label: 'الحفر الإنشائي',
      approvedVal: approved.structuralExcavationM3 || 0,
      executedVal: executed.structuralExcavationM3 || 0,
      unit: 'م3'
    },
    {
      label: 'الجدران الكتلية والمباني الحجرية',
      approvedVal: (approved.blockWalls || 0) + (approved.stoneMasonry || 0),
      executedVal: (executed.blockWalls || 0) + (executed.stoneMasonry || 0),
      unit: ''
    },
    {
      label: 'أعمال الرصف الحجري',
      approvedVal: approved.stonePaving || 0,
      executedVal: executed.stonePaving || 0,
      unit: ''
    },
    {
      label: 'أعمال الرصف الخرساني',
      approvedVal: approved.concretePaving || 0,
      executedVal: executed.concretePaving || 0,
      unit: ''
    }
  ];

  const activeItems = items.filter(i => i.approvedVal > 0 || i.executedVal > 0);

  return (
    <div className="space-y-2 bg-slate-900 text-white rounded-2xl p-3.5 border border-slate-800 text-right font-sans my-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
          <span>📐</span>
          <span>جدول المقارنة التلقائية (المعيار المعتمد بالدراسة الفنية vs المنفذ ميدانياً):</span>
        </span>
        <span className="text-[9px] text-slate-300 font-bold bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
          المطابقة والمقارنة التلقائية
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-center text-[10.5px] border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[9.5px] text-slate-400 font-bold">
              <th className="py-2 px-2 text-right">البند والبيان الفني</th>
              <th className="py-2 px-1 text-sky-400 bg-slate-950/40">📋 المعتمد بالدراسة</th>
              <th className="py-2 px-1 text-emerald-400 bg-slate-950/40">🏗️ المنفذ ميدانياً</th>
              <th className="py-2 px-1 text-amber-300">الفارق / الحيود</th>
              <th className="py-2 px-1">التقييم الفني</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {activeItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-3 text-center text-slate-500 font-sans text-[10px]">
                  لا توجد كميات فنية مفصلة مدخلة للمقارنة في هذه المبادرة.
                </td>
              </tr>
            ) : (
              activeItems.map((item, idx) => {
                const diff = item.executedVal - item.approvedVal;
                let badge = <span className="text-[9px] font-sans font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">مطابق 100%</span>;

                if (item.approvedVal > 0 && item.executedVal > 0) {
                  if (diff > 0) {
                    badge = <span className="text-[9px] font-sans font-bold text-sky-300 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800/60">▲ زيادة إيجابية</span>;
                  } else if (diff < 0) {
                    badge = <span className="text-[9px] font-sans font-bold text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/60">▼ متبقي للتنفيذ</span>;
                  }
                } else if (item.executedVal > 0) {
                  badge = <span className="text-[9px] font-sans font-bold text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded">منفذ بالميدان</span>;
                } else if (item.approvedVal > 0) {
                  badge = <span className="text-[9px] font-sans font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">معتمد بالدراسة</span>;
                }

                return (
                  <tr key={idx} className="hover:bg-slate-950/50">
                    <td className="py-2 px-2 text-right font-sans font-bold text-slate-200">{item.label}</td>
                    <td className="py-2 px-1 text-sky-300 font-bold">
                      {item.approvedVal ? `${item.approvedVal.toLocaleString('ar-YE')} ${item.unit}` : '-'}
                    </td>
                    <td className="py-2 px-1 text-emerald-300 font-bold">
                      {item.executedVal ? `${item.executedVal.toLocaleString('ar-YE')} ${item.unit}` : '-'}
                    </td>
                    <td className={`py-2 px-1 font-black ${diff === 0 ? 'text-slate-500' : diff > 0 ? 'text-sky-300' : 'text-amber-300'}`}>
                      {item.approvedVal && item.executedVal ? (
                        diff === 0 ? '0' : `${diff > 0 ? '+' : ''}${diff.toLocaleString('ar-YE')} ${item.unit}`
                      ) : '-'}
                    </td>
                    <td className="py-2 px-1">{badge}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
