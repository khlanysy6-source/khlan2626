import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  AlertCircle, 
  Filter, 
  Search, 
  Download, 
  Layers, 
  Building, 
  MapPin, 
  BarChart3, 
  ArrowUpDown,
  FileSpreadsheet,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Maximize2,
  X,
  Wrench,
  ShieldAlert,
  Sparkles,
  PieChart,
  Eye,
  FileText,
  Printer,
  FileCheck,
  Truck,
  RotateCcw
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
  Cell
} from 'recharts';
import { Initiative } from '../types';

interface DevelopmentResultsMatrixProps {
  initiatives: Initiative[];
  onSelectInitiative?: (initiative: Initiative) => void;
  targetInitiativeId?: string | null;
}

import { parseNum } from '../utils/numberAndDistrictUtils';
import { exportInitiativesToExcel } from '../utils/excelExporter';

export default function DevelopmentResultsMatrix({ initiatives, onSelectInitiative, targetInitiativeId }: DevelopmentResultsMatrixProps) {
  const [searchTerm, setSearchTerm] = useState('');

  React.useEffect(() => {
    if (targetInitiativeId) {
      const found = initiatives.find(i => i.id === targetInitiativeId);
      if (found) {
        setSearchTerm(found.name);
      }
    }
  }, [targetInitiativeId, initiatives]);
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedSector, setSelectedSector] = useState('all');
  const [varianceFilter, setVarianceFilter] = useState<'all' | 'match_or_surplus' | 'deficit'>('all');
  const [viewMode, setViewMode] = useState<'master_grid' | 'district_charts' | 'initiative_rows'>('master_grid');
  const [chartOrientation, setChartOrientation] = useState<'vertical' | 'horizontal'>('vertical');
  const [detailModalInitiative, setDetailModalInitiative] = useState<Initiative | null>(null);
  const [activeWorkbenchAction, setActiveWorkbenchAction] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Extract unique districts
  const districts = useMemo(() => {
    const set = new Set<string>();
    initiatives.forEach(init => {
      if (init.district) set.add(init.district);
    });
    return Array.from(set);
  }, [initiatives]);

  // Extract work item data per initiative
  const matrixData = useMemo(() => {
    return initiatives.map(init => {
      const appr = init.approvedStudyQuantities || {};
      const exec = init.executedWorkQuantities || {};

      const parseVal = (v: any) => parseNum(v);

      // Work items comparison
      const lengthAppr = parseVal(appr.lengthCompleted);
      const lengthExec = parseVal(exec.lengthCompleted);
      const lengthVar = lengthExec - lengthAppr;

      const widthAppr = parseVal(appr.avgWidth);
      const widthExec = parseVal(exec.avgWidth);
      const widthVar = widthExec - widthAppr;

      const cutAppr = parseVal(appr.excavationCut);
      const cutExec = parseVal(exec.excavationCut);
      const cutVar = cutExec - cutAppr;

      const expansionAppr = parseVal(appr.expansion);
      const expansionExec = parseVal(exec.expansion);
      const expansionVar = expansionExec - expansionAppr;

      const gradingAppr = parseVal(appr.gradingLevelling);
      const gradingExec = parseVal(exec.gradingLevelling);
      const gradingVar = gradingExec - gradingAppr;

      // DISTINCT: Stone Paving (m²) vs Concrete Paving (m³)
      const stonePavingAppr = parseVal(appr.stonePaving);
      const stonePavingExec = parseVal(exec.stonePaving);
      const stonePavingVar = stonePavingExec - stonePavingAppr;

      const concretePavingAppr = parseVal(appr.concretePaving);
      const concretePavingExec = parseVal(exec.concretePaving);
      const concretePavingVar = concretePavingExec - concretePavingAppr;

      const stoneMasonryAppr = parseVal(appr.stoneMasonry);
      const stoneMasonryExec = parseVal(exec.stoneMasonry);
      const stoneMasonryVar = stoneMasonryExec - stoneMasonryAppr;

      const structExcavationAppr = parseVal(appr.structuralExcavationM3);
      const structExcavationExec = parseVal(exec.structuralExcavationM3);
      const structExcavationVar = structExcavationExec - structExcavationAppr;

      // Cement tracking
      const cementAppr = parseVal(init.materialsApproved);
      const cementDisbursed = parseVal(init.materialsDisbursed);
      const cementUsed = parseVal(init.materialsUsed);
      const cementRemaining = Math.max(0, cementDisbursed - cementUsed);
      const cementVar = cementUsed - cementAppr;

      const dieselAppr = parseVal(init.dieselApproved);
      const dieselDisbursed = parseVal(init.dieselDisbursed);
      const dieselUsed = parseVal(init.dieselUsed);
      const dieselRemaining = Math.max(0, dieselDisbursed - dieselUsed);
      const dieselVar = dieselUsed - dieselAppr;

      const costAppr = parseVal(init.cost) || parseVal(init.estimatedCost);
      const costExec = parseVal(init.executionCostCompleted);
      const costVar = costExec - costAppr;

      // Count items with deficits
      const itemsList = [
        { name: 'طول الطريق', appr: lengthAppr, exec: lengthExec, var: lengthVar, unit: 'م' },
        { name: 'عرض الطريق', appr: widthAppr, exec: widthExec, var: widthVar, unit: 'م' },
        { name: 'الشق والقطع', appr: cutAppr, exec: cutExec, var: cutVar, unit: 'م³' },
        { name: 'التوسعة', appr: expansionAppr, exec: expansionExec, var: expansionVar, unit: 'م³' },
        { name: 'الحفر الإنشائي', appr: structExcavationAppr, exec: structExcavationExec, var: structExcavationVar, unit: 'م³' },
        { name: 'الرصف الحجري', appr: stonePavingAppr, exec: stonePavingExec, var: stonePavingVar, unit: 'م²' },
        { name: 'الرصف الخرساني', appr: concretePavingAppr, exec: concretePavingExec, var: concretePavingVar, unit: 'م³' },
        { name: 'مباني الحجر', appr: stoneMasonryAppr, exec: stoneMasonryExec, var: stoneMasonryVar, unit: 'م³' },
        { name: 'أكياس الأسمنت', appr: cementAppr, exec: cementUsed, var: cementVar, unit: 'كيس' },
        { name: 'الديزل', appr: dieselAppr, exec: dieselUsed, var: dieselVar, unit: 'لتر' },
        { name: 'الموازنة والإنفاق', appr: costAppr, exec: costExec, var: costVar, unit: 'ر.ي' },
      ];

      const activeItems = itemsList.filter(i => i.appr > 0 || i.exec > 0);
      const deficits = activeItems.filter(i => i.var < 0);
      const surpluses = activeItems.filter(i => i.var > 0);
      const matches = activeItems.filter(i => i.var === 0 && i.appr > 0);

      const overallStatus = deficits.length > 0 ? 'deficit' : activeItems.length > 0 ? 'match_or_surplus' : 'pending';

      return {
        initiative: init,
        items: itemsList,
        activeItems,
        deficitsCount: deficits.length,
        surplusesCount: surpluses.length,
        matchesCount: matches.length,
        overallStatus,
        lengthAppr, lengthExec, lengthVar,
        widthAppr, widthExec, widthVar,
        cutAppr, cutExec, cutVar,
        expansionAppr, expansionExec, expansionVar,
        structExcavationAppr, structExcavationExec, structExcavationVar,
        stonePavingAppr, stonePavingExec, stonePavingVar,
        concretePavingAppr, concretePavingExec, concretePavingVar,
        stoneMasonryAppr, stoneMasonryExec, stoneMasonryVar,
        cementAppr, cementDisbursed, cementUsed, cementRemaining, cementVar,
        dieselAppr, dieselDisbursed, dieselUsed, dieselRemaining, dieselVar,
        costAppr, costExec, costVar
      };
    });
  }, [initiatives]);

  // Filter matrix
  const filteredMatrix = useMemo(() => {
    return matrixData.filter(item => {
      const init = item.initiative;
      const matchesSearch = init.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            init.initiativeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (init.subDistrict && init.subDistrict.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesDistrict = selectedDistrict === 'all' || init.district === selectedDistrict;
      const matchesSector = selectedSector === 'all' || init.sector === selectedSector;
      const matchesVariance = varianceFilter === 'all' || 
                              (varianceFilter === 'deficit' && item.deficitsCount > 0) ||
                              (varianceFilter === 'match_or_surplus' && item.deficitsCount === 0 && item.activeItems.length > 0);

      return matchesSearch && matchesDistrict && matchesSector && matchesVariance;
    });
  }, [matrixData, searchTerm, selectedDistrict, selectedSector, varianceFilter]);

  // Aggregate matrix metrics
  const aggregatedTotals = useMemo(() => {
    let totLengthAppr = 0, totLengthExec = 0;
    let totStonePavingAppr = 0, totStonePavingExec = 0;
    let totConcretePavingAppr = 0, totConcretePavingExec = 0;
    let totCutAppr = 0, totCutExec = 0;
    let totCementAppr = 0, totCementDisbursed = 0, totCementUsed = 0, totCementRemaining = 0;
    let totCostAppr = 0, totCostExec = 0;

    filteredMatrix.forEach(row => {
      totLengthAppr += row.lengthAppr;
      totLengthExec += row.lengthExec;
      totStonePavingAppr += row.stonePavingAppr;
      totStonePavingExec += row.stonePavingExec;
      totConcretePavingAppr += row.concretePavingAppr;
      totConcretePavingExec += row.concretePavingExec;
      totCutAppr += row.cutAppr + row.expansionAppr;
      totCutExec += row.cutExec + row.expansionExec;
      totCementAppr += row.cementAppr;
      totCementDisbursed += row.cementDisbursed;
      totCementUsed += row.cementUsed;
      totCementRemaining += row.cementRemaining;
      totCostAppr += row.costAppr;
      totCostExec += row.costExec;
    });

    return {
      totLengthAppr, totLengthExec, totLengthVar: totLengthExec - totLengthAppr,
      totStonePavingAppr, totStonePavingExec, totStonePavingVar: totStonePavingExec - totStonePavingAppr,
      totConcretePavingAppr, totConcretePavingExec, totConcretePavingVar: totConcretePavingExec - totConcretePavingAppr,
      totCutAppr, totCutExec, totCutVar: totCutExec - totCutAppr,
      totCementAppr, totCementDisbursed, totCementUsed, totCementRemaining, totCementVar: totCementUsed - totCementAppr,
      totCostAppr, totCostExec, totCostVar: totCostExec - totCostAppr,
      totalInitiatives: filteredMatrix.length
    };
  }, [filteredMatrix]);

  // Aggregated data per district for chart rendering
  const districtChartData = useMemo(() => {
    const districtMap: Record<string, {
      districtName: string;
      stonePavingExec: number;
      stonePavingAppr: number;
      concretePavingExec: number;
      concretePavingAppr: number;
      cementDisbursed: number;
      cementUsed: number;
      totalCost: number;
      initiativeCount: number;
      completedCount: number;
      stagnantCount: number;
    }> = {};

    matrixData.forEach(row => {
      const d = row.initiative.district || 'غير محدد';
      if (!districtMap[d]) {
        districtMap[d] = {
          districtName: d.replace('مديرية ', ''),
          stonePavingExec: 0,
          stonePavingAppr: 0,
          concretePavingExec: 0,
          concretePavingAppr: 0,
          cementDisbursed: 0,
          cementUsed: 0,
          totalCost: 0,
          initiativeCount: 0,
          completedCount: 0,
          stagnantCount: 0,
        };
      }

      districtMap[d].stonePavingExec += row.stonePavingExec;
      districtMap[d].stonePavingAppr += row.stonePavingAppr;
      districtMap[d].concretePavingExec += row.concretePavingExec;
      districtMap[d].concretePavingAppr += row.concretePavingAppr;
      districtMap[d].cementDisbursed += row.cementDisbursed;
      districtMap[d].cementUsed += row.cementUsed;
      districtMap[d].totalCost += row.costExec;
      districtMap[d].initiativeCount += 1;
      if (row.initiative.status === 'completed') districtMap[d].completedCount += 1;
      if (row.initiative.status === 'stagnant' || row.initiative.status === 'stopped') districtMap[d].stagnantCount += 1;
    });

    return Object.values(districtMap);
  }, [matrixData]);

  // Excel Export
  const exportMatrixCSV = async () => {
    await exportInitiativesToExcel(
      filteredMatrix.map(r => r.initiative),
      'مصفوفة_مقارنة_الأعمال_والأسمنت'
    );
  };

  // Helper for cell rendering with dynamic color coding
  const renderVarianceCell = (appr: number, exec: number, unit = '') => {
    if (appr === 0 && exec === 0) {
      return <span className="text-slate-400 font-mono text-[10px]">—</span>;
    }

    const variance = exec - appr;
    const isMatchedOrSurplus = variance >= 0;

    return (
      <div className="flex flex-col items-center justify-center text-center py-1 px-1.5 rounded-lg transition-all">
        <div className="flex items-center justify-center gap-1 text-[11px] font-black dir-ltr">
          <span className="text-slate-900 font-bold">{exec.toLocaleString()}</span>
          <span className="text-slate-400 font-medium text-[9px]">/</span>
          <span className="text-slate-500 font-medium text-[10px]">{appr.toLocaleString()}</span>
        </div>

        <div className={`mt-0.5 px-2 py-0.5 rounded-md text-[9.5px] font-black inline-flex items-center gap-1 border ${
          isMatchedOrSurplus 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse'
        }`}>
          {isMatchedOrSurplus ? (
            variance === 0 ? (
              <span>تطابق 100% ✔️</span>
            ) : (
              <span>فائض +{variance.toLocaleString()} {unit} 📈</span>
            )
          ) : (
            <span>عجز {variance.toLocaleString()} {unit} ⚠️</span>
          )}
        </div>
      </div>
    );
  };

  // Diagnostic & Proposed Solutions Generator for Stagnant/Stumbling Initiatives
  const getProposedSolutions = (init: Initiative) => {
    const reasons: string[] = [];
    const solutions: string[] = [];

    if (init.status === 'stagnant' || init.status === 'stopped' || init.completionRate < 50) {
      reasons.push(init.stagnationReason || 'توقف إمدادات المواد أو الخلافات الاجتماعية الميدانية');
      
      solutions.push('تفعيل تدخل لجنة التعبئة والوجهاء المحليين لعقد وثيقة اتفاق مجتمعي وإنهاء النزاع حول حرم الطريق.');
      solutions.push('توفير دفعة طارئة من الإسمنت والديزل عبر مساهمة وحدة التدخلات المركزية لتسريع وتيرة الرصف.');
      solutions.push('نقل ورفع كميات الإسمنت من المخازن المكشوفة إلى مخازن مغلقة لحمايتها من الرطوبة والأمطار الجبلية.');
      solutions.push('إرسال مهندس مقيم لتوجيه فنيي الرصف وضمان ضبط الميول وفواصل التمدد المعتمدة في الدراسة.');
    } else {
      solutions.push('الاستمرار في المتابعة الأسبوعية عبر الفرسان الميدانيين وتوثيق مراحل الإنجاز أولاً بأول.');
      solutions.push('المحافظة على رش الرصف الخرساني والحجري بالماء مرتين يومياً لمدة 10 أيام متواصلة.');
    }

    return { reasons, solutions };
  };

  return (
    <div className="space-y-6 text-right dir-rtl" dir="rtl">
      {/* Matrix Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                مصفوفة مقارنة كميات الأعمال والإسمنت المعتمدة مع المنجزة
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                فصل الرصف الحجري (م²) والرصف الخرساني (م³)
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>مصفوفة المبادرات ومقارنة الكميات والأسمنت المنصرف</span>
              <BarChart3 className="w-6 h-6 text-indigo-400 shrink-0" />
            </h2>

            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              صفحة قياسية مستقلة تُحلل وتقارن **الكميات والأعمال المعتمدة بحسب الدراسة الفنية** مقابل **الكميات المنجزة والأسمنت المنصرف والمستخدم** ميدانياً. تم فصل الرصف الحجري بالمتر المربع (م²) والرصف الخرساني بالمتر المكعب (م³) بدقة مع إتاحة التحليل البياني لكل مديرية.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={exportMatrixCSV}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>تصدير المصفوفة CSV 📊</span>
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Length */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-black text-slate-500">
            <span>طول الطرق (أمتار)</span>
            <span className="p-1 bg-indigo-50 text-indigo-600 rounded-lg">📏</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-base font-black text-slate-900">{aggregatedTotals.totLengthExec.toLocaleString()} م</span>
            <span className="text-[10px] text-slate-500 font-bold">معتمد: {aggregatedTotals.totLengthAppr.toLocaleString()} م</span>
          </div>
          <div className={`text-[9.5px] font-black px-2 py-0.5 rounded-md inline-block ${
            aggregatedTotals.totLengthVar >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
          }`}>
            الفارق: {aggregatedTotals.totLengthVar >= 0 ? '+' : ''}{aggregatedTotals.totLengthVar.toLocaleString()} م
          </div>
        </div>

        {/* Stone Paving - STRICTLY m² */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-2 border-r-4 border-r-amber-500">
          <div className="flex items-center justify-between text-xs font-black text-slate-700">
            <span>🧱 الرصف الحجري (متر مربع - م²)</span>
            <span className="p-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-bold">م²</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-base font-black text-amber-900">{aggregatedTotals.totStonePavingExec.toLocaleString()} م²</span>
            <span className="text-[10px] text-slate-500 font-bold">معتمد: {aggregatedTotals.totStonePavingAppr.toLocaleString()} م²</span>
          </div>
          <div className={`text-[9.5px] font-black px-2 py-0.5 rounded-md inline-block ${
            aggregatedTotals.totStonePavingVar >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
          }`}>
            الفارق: {aggregatedTotals.totStonePavingVar >= 0 ? '+' : ''}{aggregatedTotals.totStonePavingVar.toLocaleString()} م²
          </div>
        </div>

        {/* Concrete Paving - STRICTLY m³ */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-2 border-r-4 border-r-sky-500">
          <div className="flex items-center justify-between text-xs font-black text-slate-700">
            <span>🏗️ الرصف الخرساني (متر مكعب - م³)</span>
            <span className="p-1 bg-sky-50 text-sky-700 rounded-lg text-[10px] font-bold">م³</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-base font-black text-sky-900">{aggregatedTotals.totConcretePavingExec.toLocaleString()} م³</span>
            <span className="text-[10px] text-slate-500 font-bold">معتمد: {aggregatedTotals.totConcretePavingAppr.toLocaleString()} م³</span>
          </div>
          <div className={`text-[9.5px] font-black px-2 py-0.5 rounded-md inline-block ${
            aggregatedTotals.totConcretePavingVar >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
          }`}>
            الفارق: {aggregatedTotals.totConcretePavingVar >= 0 ? '+' : ''}{aggregatedTotals.totConcretePavingVar.toLocaleString()} م³
          </div>
        </div>

        {/* Cement Analysis */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-2 border-r-4 border-r-emerald-500">
          <div className="flex items-center justify-between text-xs font-black text-slate-700">
            <span>📦 الأسمنت (منصرف / مستخدم)</span>
            <span className="p-1 bg-emerald-50 text-emerald-700 rounded-lg">أكياس</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-base font-black text-emerald-950">{aggregatedTotals.totCementUsed.toLocaleString()} كيس</span>
            <span className="text-[10px] text-slate-500 font-bold">منصرف: {aggregatedTotals.totCementDisbursed.toLocaleString()}</span>
          </div>
          <div className="text-[9.5px] font-black px-2 py-0.5 rounded-md inline-block bg-emerald-50 text-emerald-800">
            متبقي في المخازن: {aggregatedTotals.totCementRemaining.toLocaleString()} كيس
          </div>
        </div>

        {/* Cost */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-black text-slate-500">
            <span>التكلفة المنفذة (ريال)</span>
            <span className="p-1 bg-slate-100 text-slate-700 rounded-lg">💰</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-base font-black text-slate-900">{aggregatedTotals.totCostExec.toLocaleString()} ر.ي</span>
            <span className="text-[10px] text-slate-500 font-bold">المعتمدة: {aggregatedTotals.totCostAppr.toLocaleString()}</span>
          </div>
          <div className={`text-[9.5px] font-black px-2 py-0.5 rounded-md inline-block ${
            aggregatedTotals.totCostVar <= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
          }`}>
            الفارق: {aggregatedTotals.totCostVar >= 0 ? '+' : ''}{aggregatedTotals.totCostVar.toLocaleString()} ر.ي
          </div>
        </div>
      </div>

      {/* View Switcher Bar */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث باسم المبادرة، رقمها، العزلة، أو القرية..."
              className="w-full pr-10 pl-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* District Filter */}
          <div className="w-full md:w-[180px]">
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden"
            >
              <option value="all">كافة المديريات ({districts.length})</option>
              {districts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Variance Status Filter */}
          <div className="w-full md:w-[200px]">
            <select
              value={varianceFilter}
              onChange={(e) => setVarianceFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden"
            >
              <option value="all">جميع حالات الانحراف والفرز</option>
              <option value="match_or_surplus">تطابق / فائض إيجابي (الأخضر 💚)</option>
              <option value="deficit">يوجد عجز في البنود (الأحمر 🔴)</option>
            </select>
          </div>

          {/* View Modes Switcher */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shrink-0">
            <button
              onClick={() => setViewMode('master_grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'master_grid' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>جدول المقارنة 📊</span>
            </button>
            <button
              onClick={() => setViewMode('district_charts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'district_charts' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>المخططات البيانية 📈</span>
            </button>
            <button
              onClick={() => setViewMode('initiative_rows')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'initiative_rows' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>بطاقات المبادرات 🎴</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODE 1: Master Grid Table */}
      {viewMode === 'master_grid' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between text-xs font-black">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>جدول المقارنة الموحد لكافة كميات وأعمال المبادرات ({filteredMatrix.length})</span>
            </div>
            <div className="text-[10px] text-slate-400 font-normal">
              صيغة البيانات: [ المنفذ الفعلي / المعتمد بالدراسة ] + نسبة الانحراف
            </div>
          </div>

          <div className="overflow-x-auto max-h-[650px] overflow-y-auto scrollbar-thin">
            <table className="w-full text-right border-collapse text-xs">
              <thead className="bg-slate-100 text-slate-700 font-black sticky top-0 z-20 border-b border-slate-200 shadow-2xs">
                <tr>
                  <th className="p-3 border-l border-slate-200 shrink-0 w-12 text-center">#</th>
                  <th className="p-3 border-l border-slate-200 min-w-[200px]">المبادرة والمديرية</th>
                  <th className="p-3 border-l border-slate-200 text-center min-w-[120px]">طول الطريق (م)</th>
                  <th className="p-3 border-l border-slate-200 text-center min-w-[120px]">حفر إنشائي (م³)</th>
                  <th className="p-3 border-l border-slate-200 text-center min-w-[130px] bg-amber-50/70 text-amber-950">
                    الرصف الحجري (م²)
                  </th>
                  <th className="p-3 border-l border-slate-200 text-center min-w-[130px] bg-sky-50/70 text-sky-950">
                    الرصف الخرساني (م³)
                  </th>
                  <th className="p-3 border-l border-slate-200 text-center min-w-[130px] bg-emerald-50/70 text-emerald-950">
                    الأسمنت (منصرف/مستخدم)
                  </th>
                  <th className="p-3 border-l border-slate-200 text-center min-w-[120px]">الديزل المستهلك</th>
                  <th className="p-3 border-l border-slate-200 text-center min-w-[130px]">التكلفة والإنفاق</th>
                  <th className="p-3 text-center min-w-[140px]">الإجراء والتفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredMatrix.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-slate-500 font-bold bg-slate-50">
                      لا توجد مبادرات مطابقة للفلاتر المحددة حالياً.
                    </td>
                  </tr>
                ) : (
                  filteredMatrix.map((row, idx) => {
                    const init = row.initiative;
                    return (
                      <tr key={init.id} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="p-3 text-center font-bold text-slate-500 border-l border-slate-100">
                          {idx + 1}
                        </td>

                        <td className="p-3 border-l border-slate-100 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-700">
                              {init.initiativeNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setDetailModalInitiative(init);
                                if (onSelectInitiative) onSelectInitiative(init);
                              }}
                              className="font-extrabold text-slate-900 text-xs hover:text-indigo-600 transition-colors text-right cursor-pointer"
                            >
                              {init.name}
                            </button>
                          </div>
                          <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-2">
                            <span>📍 {init.district} - {init.subDistrict}</span>
                            <span className={`px-1.5 py-0.2 rounded-sm text-[9px] font-black ${
                              init.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                              init.status === 'stagnant' || init.status === 'stopped' ? 'bg-rose-100 text-rose-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {init.status === 'completed' ? 'مكتمل' : init.status === 'stagnant' ? 'متعثر' : 'جاري التنفيذ'}
                            </span>
                          </div>
                        </td>

                        {/* Length */}
                        <td className="p-2 border-l border-slate-100 text-center">
                          {renderVarianceCell(row.lengthAppr, row.lengthExec, 'م')}
                        </td>

                        {/* Struct Excavation */}
                        <td className="p-2 border-l border-slate-100 text-center">
                          {renderVarianceCell(row.structExcavationAppr, row.structExcavationExec, 'م³')}
                        </td>

                        {/* Stone Paving (m²) */}
                        <td className="p-2 border-l border-slate-100 text-center bg-amber-50/20">
                          {renderVarianceCell(row.stonePavingAppr, row.stonePavingExec, 'م²')}
                        </td>

                        {/* Concrete Paving (m³) */}
                        <td className="p-2 border-l border-slate-100 text-center bg-sky-50/20">
                          {renderVarianceCell(row.concretePavingAppr, row.concretePavingExec, 'م³')}
                        </td>

                        {/* Cement */}
                        <td className="p-2 border-l border-slate-100 text-center bg-emerald-50/20">
                          {renderVarianceCell(row.cementAppr, row.cementUsed, 'كيس')}
                        </td>

                        {/* Diesel */}
                        <td className="p-2 border-l border-slate-100 text-center">
                          {renderVarianceCell(row.dieselAppr, row.dieselUsed, 'لتر')}
                        </td>

                        {/* Cost */}
                        <td className="p-2 border-l border-slate-100 text-center">
                          {renderVarianceCell(row.costAppr, row.costExec, 'ر.ي')}
                        </td>

                        {/* Action Details Button */}
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setDetailModalInitiative(init);
                              if (onSelectInitiative) onSelectInitiative(init);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-[10px] font-black transition-all cursor-pointer shadow-3xs"
                          >
                            <Eye className="w-3 h-3" />
                            <span>عرض التفاصيل والحلول 🔍</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODE 2: District Charts Analysis */}
      {viewMode === 'district_charts' && (
        <div className="space-y-6">
          {/* Orientation Control Bar */}
          <div className="bg-white border border-slate-200 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
            <span className="text-xs font-black text-slate-700 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>طريقة عرض المخططات البيانية للمديريات:</span>
            </span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setChartOrientation('vertical')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  chartOrientation === 'vertical' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📊 اعمدة عمودية
              </button>
              <button
                type="button"
                onClick={() => setChartOrientation('horizontal')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  chartOrientation === 'horizontal' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📊 اعمدة عرضية (أفقي)
              </button>
            </div>
          </div>

          {/* Chart 1: Stone Paving (m²) vs Concrete Paving (m³) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-600" />
                <span>مقارنة الرصف الحجري بالمتر المربع (م²) والرصف الخرساني بالمتر المكعب (م³) حسب المديرية:</span>
              </h3>
              <span className="text-[10px] font-bold px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg">
                🧱 الحجري: م² | 🏗️ الخرساني: م³
              </span>
            </div>

            <div className={`${chartOrientation === 'horizontal' ? 'h-[480px]' : 'h-[340px]'} w-full dir-ltr`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={districtChartData} 
                  layout={chartOrientation === 'horizontal' ? 'vertical' : 'horizontal'}
                  margin={{ top: 10, right: 30, left: chartOrientation === 'horizontal' ? 80 : 10, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={chartOrientation === 'horizontal'} horizontal={chartOrientation === 'vertical'} stroke="#E2E8F0" />
                  {chartOrientation === 'horizontal' ? (
                    <>
                      <YAxis dataKey="districtName" type="category" tick={{ fontSize: 11, fontWeight: 'bold' }} width={80} />
                      <XAxis type="number" />
                    </>
                  ) : (
                    <>
                      <XAxis dataKey="districtName" tick={{ fontSize: 11, fontWeight: 'bold' }} interval={0} angle={-15} textAnchor="end" />
                      <YAxis />
                    </>
                  )}
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      `${Number(value).toLocaleString()} ${name.includes('حجري') ? 'م² (متر مربع)' : 'م³ (متر مكعب)'}`,
                      name
                    ]}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px', fontWeight: 'bold' }} />
                  <Bar dataKey="stonePavingExec" name="الرصف الحجري المنجز (م²)" fill="#d97706" radius={chartOrientation === 'horizontal' ? [0, 4, 4, 0] : [4, 4, 0, 0]} />
                  <Bar dataKey="concretePavingExec" name="الرصف الخرساني المنجز (م³)" fill="#0284c7" radius={chartOrientation === 'horizontal' ? [0, 4, 4, 0] : [4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Cement Lifecycle per District */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>تحليل دورة حياة الأسمنت بالمديريات (المنصرف للموقع vs المستخدم فعلياً - أكياس):</span>
              </h3>
              <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg">
                📦 وحدة القياس: كيس أسمنت
              </span>
            </div>

            <div className={`${chartOrientation === 'horizontal' ? 'h-[480px]' : 'h-[340px]'} w-full dir-ltr`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={districtChartData} 
                  layout={chartOrientation === 'horizontal' ? 'vertical' : 'horizontal'}
                  margin={{ top: 10, right: 30, left: chartOrientation === 'horizontal' ? 80 : 10, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={chartOrientation === 'horizontal'} horizontal={chartOrientation === 'vertical'} stroke="#E2E8F0" />
                  {chartOrientation === 'horizontal' ? (
                    <>
                      <YAxis dataKey="districtName" type="category" tick={{ fontSize: 11, fontWeight: 'bold' }} width={80} />
                      <XAxis type="number" />
                    </>
                  ) : (
                    <>
                      <XAxis dataKey="districtName" tick={{ fontSize: 11, fontWeight: 'bold' }} interval={0} angle={-15} textAnchor="end" />
                      <YAxis />
                    </>
                  )}
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      `${Number(value).toLocaleString()} كيس`,
                      name
                    ]}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px', fontWeight: 'bold' }} />
                  <Bar dataKey="cementDisbursed" name="الأسمنت المنصرف للموقع (كيس)" fill="#059669" radius={chartOrientation === 'horizontal' ? [0, 4, 4, 0] : [4, 4, 0, 0]} />
                  <Bar dataKey="cementUsed" name="الأسمنت المستخدم بالرصف (كيس)" fill="#10b981" radius={chartOrientation === 'horizontal' ? [0, 4, 4, 0] : [4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: Initiative Cards View */}
      {viewMode === 'initiative_rows' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatrix.map((row) => {
            const init = row.initiative;
            return (
              <div key={init.id} className="bg-white border border-slate-200/90 rounded-2xl p-4.5 space-y-3.5 shadow-xs text-right">
                <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-100">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700">
                      {init.initiativeNumber}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      {init.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      📍 {init.district} - {init.subDistrict} ({init.village})
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black ${
                      row.deficitsCount > 0 ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      {row.deficitsCount > 0 ? `⚠️ ${row.deficitsCount} بنود عجز` : 'مطابق بالكامل 💚'}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setDetailModalInitiative(init);
                        if (onSelectInitiative) onSelectInitiative(init);
                      }}
                      className="px-2 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-md text-[10px] font-black transition-all cursor-pointer"
                    >
                      التفاصيل والحلول 📋
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 block">مصفوفة بنود الأعمال المقارنة:</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {row.items.map((item, idx) => {
                      if (item.appr === 0 && item.exec === 0) return null;
                      const isSurplus = item.var >= 0;
                      return (
                        <div key={idx} className={`p-2 rounded-xl border text-right space-y-1 ${
                          isSurplus ? 'bg-emerald-50/40 border-emerald-100' : 'bg-rose-50/40 border-rose-100'
                        }`}>
                          <div className="text-[10px] font-black text-slate-700 flex justify-between">
                            <span>{item.name}</span>
                            <span className="text-slate-400 font-normal">{item.unit}</span>
                          </div>
                          <div className="text-[11px] font-bold text-slate-900 flex justify-between">
                            <span>منفذ: {item.exec.toLocaleString()}</span>
                            <span className="text-slate-500 text-[10px]">معتمد: {item.appr.toLocaleString()}</span>
                          </div>
                          <div className={`text-[9.5px] font-black ${isSurplus ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {isSurplus ? `فائض/تطابق: +${item.var.toLocaleString()}` : `عجز: ${item.var.toLocaleString()}`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL INITIATIVE DETAIL & PROPOSED SOLUTIONS MODAL */}
      {detailModalInitiative && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full p-6 space-y-6 shadow-2xl relative text-right dir-rtl my-8 max-h-[90vh] overflow-y-auto scrollbar-thin">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-900 font-mono text-xs font-black">
                    {detailModalInitiative.initiativeNumber}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                    detailModalInitiative.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                    detailModalInitiative.status === 'stagnant' ? 'bg-rose-100 text-rose-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {detailModalInitiative.status === 'completed' ? 'مكتملة' : detailModalInitiative.status === 'stagnant' ? 'متعثرة' : 'قيد التنفيذ'}
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  {detailModalInitiative.name}
                </h2>

                <p className="text-xs text-slate-500 font-bold mt-1">
                  📍 {detailModalInitiative.district} • {detailModalInitiative.subDistrict} • {detailModalInitiative.village}
                </p>
              </div>

              <button
                onClick={() => setDetailModalInitiative(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quantities Comparison Grid */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>مقارنة كميات المبادرة (المعتمدة بالدراسة vs المنفذة فعلياً):</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Stone Paving */}
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl text-right space-y-1">
                  <span className="text-[10px] font-black text-amber-900 block">🧱 الرصف الحجري (م²)</span>
                  <div className="text-sm font-extrabold text-slate-900">
                    {detailModalInitiative.executedWorkQuantities?.stonePaving || 0} م²
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold">
                    دراسة: {detailModalInitiative.approvedStudyQuantities?.stonePaving || 0} م²
                  </div>
                </div>

                {/* Concrete Paving */}
                <div className="p-3 bg-sky-50/80 border border-sky-200 rounded-2xl text-right space-y-1">
                  <span className="text-[10px] font-black text-sky-900 block">🏗️ الرصف الخرساني (م³)</span>
                  <div className="text-sm font-extrabold text-slate-900">
                    {detailModalInitiative.executedWorkQuantities?.concretePaving || 0} م³
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold">
                    دراسة: {detailModalInitiative.approvedStudyQuantities?.concretePaving || 0} م³
                  </div>
                </div>

                {/* Stone Masonry */}
                <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-2xl text-right space-y-1">
                  <span className="text-[10px] font-black text-indigo-900 block">⛰️ مباني حجر (م³)</span>
                  <div className="text-sm font-extrabold text-slate-900">
                    {detailModalInitiative.executedWorkQuantities?.stoneMasonry || 0} م³
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold">
                    دراسة: {detailModalInitiative.approvedStudyQuantities?.stoneMasonry || 0} م³
                  </div>
                </div>

                {/* Cement Bags */}
                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-right space-y-1">
                  <span className="text-[10px] font-black text-emerald-900 block">📦 الأسمنت المستهلك</span>
                  <div className="text-sm font-extrabold text-slate-900">
                    {detailModalInitiative.materialsUsed || 0} كيس
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold">
                    منصرف: {detailModalInitiative.materialsDisbursed || 0} كيس
                  </div>
                </div>
              </div>
            </div>

            {/* Cement & Diesel Materials Lifecycle Section */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 text-xs">
              <span className="font-black text-slate-800 flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>📊 أرصدة ودورة حياة المواد الوقودية ومواد البناء بالمبادرة:</span>
              </span>

              {/* Cement Row */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-black text-emerald-900 block">📦 الأسمنت البورتلاندي:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-bold">معتمد الدراسة</span>
                    <span className="font-extrabold text-slate-900">{detailModalInitiative.materialsApproved || '0 كيس'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-bold">المنصرف للموقع</span>
                    <span className="font-extrabold text-emerald-700">{detailModalInitiative.materialsDisbursed || '0 كيس'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-bold">المستخدم بالرصف</span>
                    <span className="font-extrabold text-indigo-700">{detailModalInitiative.materialsUsed || '0 كيس'}</span>
                  </div>
                  <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-300">
                    <span className="text-[10px] text-emerald-800 block font-black">المتبقي لدى المبادرة (عهدة ميدانية)</span>
                    <span className="font-black text-emerald-950 text-xs">{detailModalInitiative.materialsRemaining || '0 كيس'}</span>
                  </div>
                </div>
              </div>

              {/* Diesel Row */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <span className="text-[11px] font-black text-amber-900 block">⛽ وقود الديزل للتشغيل:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-bold">معتمد الدراسة</span>
                    <span className="font-extrabold text-slate-900">{detailModalInitiative.dieselApproved || '0 لتر'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-bold">المنصرف للموقع</span>
                    <span className="font-extrabold text-amber-700">{detailModalInitiative.dieselDisbursed || '0 لتر'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block font-bold">المستهلك بالمعدات</span>
                    <span className="font-extrabold text-indigo-700">{detailModalInitiative.dieselUsed || '0 لتر'}</span>
                  </div>
                  <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-300">
                    <span className="text-[10px] text-amber-800 block font-black">المتبقي لدى المبادرة (عهدة ميدانية)</span>
                    <span className="font-black text-amber-950 text-xs">{detailModalInitiative.dieselRemaining || '0 لتر'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Field Notes & Stagnation Diagnostic */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>الملاحظات الميدانية وإشعار التعثر والمخاطر:</span>
              </h3>

              <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-2xl text-xs space-y-2 text-rose-950 font-bold">
                <p>
                  • أسباب التعثر المسجلة: <span className="font-extrabold text-rose-700">{detailModalInitiative.stagnationReason || 'لا توجد بلاغات تعثر رسمية، سير العمل منتظم.'}</span>
                </p>
                {detailModalInitiative.notes && (
                  <p>• ملاحظات الشيت الميداني: {detailModalInitiative.notes}</p>
                )}
              </div>
            </div>

            {/* Interactive Problem Solving Workbench Tools */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <h3 className="text-sm font-black text-slate-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-indigo-600" />
                  <span>أدوات وتدابير معالجة الإشكاليات والتعثر الميداني:</span>
                </span>
                <span className="text-[10px] text-slate-500 font-bold">اضغط لاستخراج الوثيقة أو تنفيذ الإجراء</span>
              </h3>

              {actionSuccessMessage && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-black flex items-center justify-between animate-fade-in">
                  <span>{actionSuccessMessage}</span>
                  <button type="button" onClick={() => setActionSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-950">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveWorkbenchAction('agreement');
                    setActionSuccessMessage(`تم توليد مسودة "وثيقة الاتفاق والتعهد المجتمعي" الخاصة بـ (${detailModalInitiative.name}) بنجاح. جاهزة للطباعة والتوقيع! 📜`);
                  }}
                  className="p-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-2xl text-right transition-all cursor-pointer space-y-1 group"
                >
                  <div className="flex items-center gap-1.5 text-indigo-950 font-black text-xs group-hover:text-indigo-700">
                    <FileCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>وثيقة الاتفاق والتوافق 📜</span>
                  </div>
                  <p className="text-[10px] text-slate-600 font-semibold leading-relaxed">
                    إصدار وثيقة التزام مجتمعي لحل النزاعات وحرم الطريق وتوقيع العقال والمبادرة.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveWorkbenchAction('curing');
                    setActionSuccessMessage(`تم إصدار جدول نوبات الرصف الحجري المعتمد لموقع (${detailModalInitiative.name}). ⛏️`);
                  }}
                  className="p-3 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-2xl text-right transition-all cursor-pointer space-y-1 group"
                >
                  <div className="flex items-center gap-1.5 text-sky-950 font-black text-xs group-hover:text-sky-700">
                    <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>جدول نوبات الرصف الحجري وتأمين المستودع ⛏️</span>
                  </div>
                  <p className="text-[10px] text-slate-600 font-semibold leading-relaxed">
                    توليد جدول نوبات العمالة وحفظ أكياس الإسمنت وضبط معايير الرصف الحجري والجدران.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveWorkbenchAction('emergency');
                    setActionSuccessMessage(`تم رفع مذكرة طلب دعم طارئ (أسمنت ودعم فني) للفرع المركزي الخاص بـ (${detailModalInitiative.name}). 🚚`);
                  }}
                  className="p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-2xl text-right transition-all cursor-pointer space-y-1 group"
                >
                  <div className="flex items-center gap-1.5 text-amber-950 font-black text-xs group-hover:text-amber-700">
                    <Truck className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>طلب إمداد إسمنت طارئ 🚚</span>
                  </div>
                  <p className="text-[10px] text-slate-600 font-semibold leading-relaxed">
                    إرسال إشعار مستعجل لوحدة التدخلات لفك الاختناق وصرف الدعم المتبقي.
                  </p>
                </button>
              </div>
            </div>

            {/* Proposed Solutions Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-emerald-600" />
                <span>الحلول المقترحة والموصى بها لمعالجة الاشكاليات واستكمال التنفيذ:</span>
              </h3>

              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-xs space-y-2 text-emerald-950 font-bold">
                {getProposedSolutions(detailModalInitiative).solutions.map((sol, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-700 shrink-0">✔️</span>
                    <span>{sol}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Close */}
            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDetailModalInitiative(null)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black cursor-pointer shadow-md"
              >
                إغلاق النافذة ✖️
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
