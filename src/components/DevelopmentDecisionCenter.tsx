import React, { useState, useMemo, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Filter,
  Search,
  Printer,
  Download,
  Building,
  ShieldAlert,
  Sparkles,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Gauge,
  Activity,
  FileCheck,
  FileSpreadsheet,
  Award,
  ChevronLeft,
  ChevronRight,
  Info,
  Sliders,
  Maximize2,
  X,
  Target,
  RefreshCw,
  Zap,
  Check,
  AlertCircle,
  MapPin,
  Coins,
  Fuel,
  PackageCheck,
  Wallet,
  FileText,
  Presentation,
  Network,
  ArrowLeft
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
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Initiative } from '../types';
import { exportInitiativesToExcel } from '../utils/excelExporter';
import {
  analyzeInitiative,
  summarizePortfolio,
  InitiativeAnalysis,
  PortfolioExecutiveSummary,
  FiveTierCategoryKey,
  FiveTierClassification
} from '../utils/healthAndGapAnalysis';
import { parseNum, CANONICAL_DISTRICTS, matchDistrictStrict } from '../utils/numberAndDistrictUtils';
import DecisionsCollectionCenter from './DecisionsCollectionCenter';
import SmartExecutiveCommandPortal from './SmartExecutiveCommandPortal';

import { ExecutiveDecisionModal, ExecutiveActionType } from './ExecutiveDecisionModal';

interface DevelopmentDecisionCenterProps {
  initiatives: Initiative[];
  onSelectInitiative?: (initiative: Initiative) => void;
  targetInitiativeId?: string | null;
  onUpdateInitiative?: (initiative: Initiative) => void;
}

export default function DevelopmentDecisionCenter({
  initiatives,
  onSelectInitiative,
  targetInitiativeId,
  onUpdateInitiative
}: DevelopmentDecisionCenterProps) {
  const [activeTab, setActiveTab] = useState<
    'official_decisions' | 'executive_command' | 'dashboard' | 'health_and_gaps' | 'resources' | 'priority_list' | 'five_tier_matrix' | 'enhanced_table' | 'leadership_summary'
  >(targetInitiativeId ? 'health_and_gaps' : 'official_decisions');

  const [fiveCategoryFilter, setFiveCategoryFilter] = useState<'all' | FiveTierCategoryKey | 'overused_cement'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Executive Decision Modal State
  const [activeDecisionInit, setActiveDecisionInit] = useState<Initiative | null>(null);
  const [activeDecisionAction, setActiveDecisionAction] = useState<ExecutiveActionType>('direct');
  const [decisionSuccessMsg, setDecisionSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (targetInitiativeId) {
      const found = initiatives.find(i => i.id === targetInitiativeId);
      if (found) {
        setSearchTerm(found.name);
        setActiveTab('health_and_gaps');
      }
    }
  }, [targetInitiativeId, initiatives]);
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'ready_for_completion' | 'needs_followup' | 'needs_decision'>('all');
  const [prioritySortMode, setPrioritySortMode] = useState<'closure_first' | 'intervention_first' | 'completion_desc' | 'cement_credit_desc'>('closure_first');
  const [healthFilter, setHealthFilter] = useState<'all' | 'good' | 'warning' | 'critical'>('all');
  const [showExecutiveReportModal, setShowExecutiveReportModal] = useState(false);

  // Map initiative counts per district across all dataset
  const districtCountsMap = useMemo(() => {
    const map: Record<string, number> = {};
    initiatives.forEach((init) => {
      const dName = init.district?.replace(/^مديرية\s+/, '').trim() || 'غير محدد';
      map[dName] = (map[dName] || 0) + 1;
      if (init.district) {
        map[init.district] = (map[init.district] || 0) + 1;
      }
    });
    return map;
  }, [initiatives]);

  // Unique list of districts in current dataset
  const availableDistricts = useMemo(() => {
    const set = new Set<string>();
    initiatives.forEach((init) => {
      if (init.district) set.add(init.district);
    });
    return Array.from(set).sort();
  }, [initiatives]);

  // Initiatives strictly filtered for the selected district or whole governorate
  const districtFilteredInitiatives = useMemo(() => {
    if (selectedDistrict === 'all' || selectedDistrict === 'جميع مديريات المحافظة') {
      return initiatives;
    }
    return initiatives.filter((init) => matchDistrictStrict(init.district, selectedDistrict));
  }, [initiatives, selectedDistrict]);

  // Analyze filtered initiatives
  const initiativeAnalyses = useMemo(() => {
    return districtFilteredInitiatives.map(analyzeInitiative);
  }, [districtFilteredInitiatives]);

  // Executive portfolio summary strictly computed for selected district/governorate
  const summary: PortfolioExecutiveSummary = useMemo(() => {
    return summarizePortfolio(districtFilteredInitiatives);
  }, [districtFilteredInitiatives]);

  // Filtered analyses based on search and sub-filters
  const filteredAnalyses = useMemo(() => {
    return initiativeAnalyses.filter((item) => {
      const init = item.initiative;
      const matchesSearch =
        searchTerm === '' ||
        init.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        init.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        init.subDistrict?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPriority =
        priorityFilter === 'all' || item.priorityClassification.level === priorityFilter;

      const matchesHealth =
        healthFilter === 'all' || item.healthCategory === healthFilter;

      return matchesSearch && matchesPriority && matchesHealth;
    });
  }, [initiativeAnalyses, searchTerm, priorityFilter, healthFilter]);

  // Chart data 1: Approved vs Executed Paving & Work
  const workChartData = useMemo(() => {
    return [
      {
        name: 'الرصف الحجري (م²)',
        المعتمد: summary.totalApprovedPavingM2,
        المنفذ: summary.totalExecutedPavingM2
      },
      {
        name: 'الرصف الخرساني (م³)',
        المعتمد: summary.totalApprovedConcreteM3,
        المنفذ: summary.totalExecutedConcreteM3
      },
      {
        name: 'أطوال الطرق (م)',
        المعتمد: summary.totalApprovedLengthM,
        المنفذ: summary.totalExecutedLengthM
      }
    ];
  }, [summary]);

  // Chart data 2: Materials Breakdown (Cement & Diesel)
  const materialsChartData = useMemo(() => {
    return [
      {
        name: 'الأسمنت (كيس)',
        المعتمد: summary.cement.approved,
        المصروف: summary.cement.disbursed,
        المستخدم: summary.cement.used,
        'الرصيد لدى الوحدة': summary.cement.unitCreditBalance,
        'المتبقي بالموقع': summary.cement.remaining
      },
      {
        name: 'الديزل (لتر)',
        المعتمد: summary.diesel.approved,
        المصروف: summary.diesel.disbursed,
        المستخدم: summary.diesel.used,
        'الرصيد لدى الوحدة': summary.diesel.unitCreditBalance,
        'المتبقي بالموقع': summary.diesel.remaining
      }
    ];
  }, [summary]);

  // Chart data 3: Health Category Distribution
  const healthPieData = useMemo(() => {
    return [
      { name: 'أداء جيد وقابل للاستمرار (🟢)', value: summary.healthDistribution.good, color: '#10b981' },
      { name: 'يحتاج متابعة (🟡)', value: summary.healthDistribution.warning, color: '#f59e0b' },
      { name: 'يحتاج قرار أو مراجعة (🔴)', value: summary.healthDistribution.critical, color: '#f43f5e' }
    ];
  }, [summary]);

  // Export Table to Professional Styled Multi-Tab Excel (.xlsx)
  const handleExportCSV = async () => {
    const listToExport = filteredAnalyses.map(a => a.initiative);
    const districtName = selectedDistrict === 'all' ? 'محافظة_إب' : selectedDistrict.replace(/\s+/g, '_');
    await exportInitiativesToExcel(listToExport, `سجل_القرارات_التنموية_${districtName}`);
  };

  const selectedDistrictLabel =
    selectedDistrict === 'all' ? 'محافظة إب بالكامل (كافة المديريات الـ 20)' : selectedDistrict;

  {/* EXPORT TO WORD DOC HANDLER */}
  const handleExportWordDoc = () => {
    const dateStr = new Date().toLocaleDateString('ar-YE');
    const titleStr = `تقرير مؤشرات القرار والنتائج التنموية - ${selectedDistrictLabel}`;

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-microsoft-com:office:office"
            xmlns:w="urn:schemas-microsoft-microsoft-com:office:word"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>${titleStr}</title>
        <style>
          body { font-family: 'Cairo', 'Traditional Arabic', Arial, sans-serif; direction: rtl; text-align: right; padding: 20px; line-height: 1.6; color: #0f172a; }
          h1 { color: #065f46; font-size: 20px; border-bottom: 2px solid #065f46; padding-bottom: 8px; margin-bottom: 12px; }
          h2 { color: #1e293b; font-size: 15px; margin-top: 25px; border-right: 4px solid #10b981; padding-right: 8px; }
          .header-box { background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 15px; }
          .kpi-table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
          .kpi-table th, .kpi-table td { border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-size: 12px; }
          .kpi-table th { background-color: #0f172a; color: #ffffff; font-weight: bold; }
          .mindmap-box { background-color: #f1f5f9; border: 1px solid #94a3b8; padding: 12px; border-radius: 8px; margin-top: 10px; }
          .recommendation-list { background-color: #ecfdf5; border-right: 4px solid #10b981; padding: 10px 15px; margin: 15px 0; }
          .portal-banner { background-color: #0f172a; color: #ffffff; padding: 10px 15px; border-radius: 6px; margin-top: 30px; margin-bottom: 15px; }
          .portal-banner h2 { color: #34d399; margin: 0; border: none; padding: 0; font-size: 16px; }
          .data-table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
          .data-table th, .data-table td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: right; font-size: 11px; }
          .data-table th { background-color: #065f46; color: #ffffff; }
          .badge-good { background-color: #d1fae5; color: #065f46; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
          .badge-warn { background-color: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
          .badge-danger { background-color: #ffe4e6; color: #9f1239; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
          .footer { margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 11px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div style="text-align: center; font-size: 11px; color: #64748b; font-weight: bold;">جمهورية اليمن - قيادة محافظة إب - وحدة التدخلات التنموية المركزية</div>
          <h1>${titleStr}</h1>
          <p style="font-size: 12px; margin: 0;"><strong>تاريخ الصدور:</strong> ${dateStr}م | <strong>حجم المحفظة:</strong> ${summary.totalInitiatives} مبادرة | <strong>مساهمة الوحدة:</strong> ${(summary.totalUnitContribution / 1000000).toFixed(1)}M YER</p>
        </div>

        <h2>أولاً: الميزان القيادي العام للكميات وكفاءة الموارد</h2>
        <table class="kpi-table">
          <tr>
            <th>إجمالي المبادرات</th>
            <th>مساهمة الوحدة المركزية</th>
            <th>المساهمة المجتمعية</th>
            <th>رصيد الأسمنت المتبقي لدى الوحدة</th>
            <th>رصيد الديزل بانتظار الصرف</th>
          </tr>
          <tr>
            <td><b>${summary.totalInitiatives}</b> مبادرة</td>
            <td><b>${(summary.totalUnitContribution / 1000000).toFixed(1)}M YER</b></td>
            <td><b>${(summary.totalCommunityContribution / 1000000).toFixed(1)}M YER</b></td>
            <td><b>${summary.cement.unitCreditBalance.toLocaleString('ar-YE')} كيس</b></td>
            <td><b>${summary.diesel.unitCreditBalance.toLocaleString('ar-YE')} لتر</b></td>
          </tr>
        </table>

        <h2>ثانياً: الخريطة الذهنية الشجرية لهيكلة القرار (Executive Mind Map)</h2>
        <div class="mindmap-box">
          <p><strong>• المحور الفني والإنجاز:</strong> متوسط نسبة الإنجاز للنطاق الحالي هو (<b>${summary.avgCompletionRate}%</b>)، بمتوسط مؤشر صحة (<b>${summary.healthDistribution.avgHealthScore}/100</b>).</p>
          <p><strong>• ميزان كميات المواد:</strong> المنصرف للموقع فعلياً (<b>${summary.cement.disbursed.toLocaleString('ar-YE')} كيس أسمنت</b>)، بينما يبلغ رصيد المبادرات غير المنصرف لدى الوحدة (<b>${summary.cement.unitCreditBalance.toLocaleString('ar-YE')} كيس</b>).</p>
          <p><strong>• الفجوات المرصودة:</strong> ${summary.keyGaps.join(' | ')}</p>
        </div>

        <h2>ثالثاً: التوصيات والقرارات الاستراتيجية القيادية</h2>
        <div class="recommendation-list">
          <ul>
            ${summary.executiveRecommendations.map((r) => `<li>${r}</li>`).join('')}
          </ul>
        </div>

        <!-- PORTAL 1: INITIATIVES HEALTH & FIELD GAPS -->
        <div class="portal-banner">
          <h2>صفحة / بوابة: صحة المبادرات وفجوات التنفيذ الميدانية (Health & Field Gaps)</h2>
        </div>
        <p style="font-size:12px;"><strong>ملخص توزيع مؤشرات صحة المبادرات بالنطاق (${selectedDistrictLabel}):</strong> متوسط صحة المحفظة هو <b>${summary.healthDistribution.avgHealthScore}/100</b>. عدد المبادرات ذات الأداء الجيد (<b>${summary.healthDistribution.good}</b>) | يحتاج متابعة (<b>${summary.healthDistribution.warning}</b>) | أداء حرج ويحتاج قرار (<b>${summary.healthDistribution.critical}</b>).</p>
        
        <table class="data-table">
          <thead>
            <tr>
              <th>اسم المبادرة والمديرية</th>
              <th>نسبة الإنجاز</th>
              <th>مؤشر الصحة /100</th>
              <th>حالة الفجوة الميدانية</th>
              <th>رصيد أسمنت لدى الوحدة</th>
              <th>توصية القرار</th>
            </tr>
          </thead>
          <tbody>
            ${districtFilteredInitiatives.map((init) => {
              const analysis = analyzeInitiative(init);
              return `
                <tr>
                  <td><b>${init.name}</b> (${init.district})</td>
                  <td>${init.completionRate}%</td>
                  <td><span class="${analysis.healthScore >= 75 ? 'badge-good' : analysis.healthScore >= 50 ? 'badge-warn' : 'badge-danger'}">${analysis.healthScore}/100</span></td>
                  <td>${analysis.executionGap.gapStatusLabel}</td>
                  <td><b>${analysis.resourceEfficiency.cementUnitCreditBalance} كيس</b></td>
                  <td>${analysis.recommendation}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <!-- PORTAL 2: RESOURCE EFFICIENCY & UNIT CREDIT BALANCE -->
        <div class="portal-banner">
          <h2>صفحة / بوابة: كفاءة الموارد وميزان رصيد المبادرات لدى الوحدة (Resource Efficiency)</h2>
        </div>
        <p style="font-size:12px;">ميزان الأسمنت: معتمد (<b>${summary.cement.approved.toLocaleString('ar-YE')} كيس</b>) | منصرف (<b>${summary.cement.disbursed.toLocaleString('ar-YE')} كيس</b>) | مستهلك (<b>${summary.cement.used.toLocaleString('ar-YE')} كيس</b>) | متبقي بموقع العمل (<b>${summary.cement.remaining.toLocaleString('ar-YE')} كيس</b>) | <b>رصيد لدى الوحدة لم يُصرف بعد (${summary.cement.unitCreditBalance.toLocaleString('ar-YE')} كيس)</b>.</p>
        <p style="font-size:12px;">ميزان الديزل: معتمد (<b>${summary.diesel.approved.toLocaleString('ar-YE')} لتر</b>) | منصرف (<b>${summary.diesel.disbursed.toLocaleString('ar-YE')} لتر</b>) | مستهلك (<b>${summary.diesel.used.toLocaleString('ar-YE')} لتر</b>) | <b>رصيد لدى الوحدة لم يُصرف بعد (${summary.diesel.unitCreditBalance.toLocaleString('ar-YE')} لتر)</b>.</p>

        <table class="data-table">
          <thead>
            <tr>
              <th>المبادرة</th>
              <th>مساهمة الوحدة YER</th>
              <th>أسمنت معتمد</th>
              <th>أسمنت منصرف</th>
              <th>رصيد أسمنت لدى الوحدة</th>
              <th>ديزل معتمد</th>
              <th>رصيد ديزل لدى الوحدة</th>
            </tr>
          </thead>
          <tbody>
            ${districtFilteredInitiatives.map((init) => {
              const analysis = analyzeInitiative(init);
              return `
                <tr>
                  <td><b>${init.name}</b></td>
                  <td>${parseNum(init.unitContribution).toLocaleString('ar-YE')}</td>
                  <td>${analysis.resourceEfficiency.cementAppr}</td>
                  <td>${analysis.resourceEfficiency.cementDisbursed}</td>
                  <td style="color:#b45309; font-weight:bold;">${analysis.resourceEfficiency.cementUnitCreditBalance} كيس</td>
                  <td>${analysis.resourceEfficiency.dieselAppr}</td>
                  <td style="color:#0369a1; font-weight:bold;">${analysis.resourceEfficiency.dieselUnitCreditBalance} لتر</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <!-- PORTAL 3: PRIORITY CLASSIFICATION & DECISION TIERS -->
        <div class="portal-banner">
          <h2>صفحة / بوابة: تصنيف الأولويات والتدخلات القيادية (Priority Classification Tiers)</h2>
        </div>

        <h3 style="color:#065f46;">١. مبادرات جاهزة للإكمال 🟢 (${summary.priorityGroups.readyForCompletion.length})</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>المبادرة</th>
              <th>المديرية</th>
              <th>نسبة الإنجاز</th>
              <th>سبب التصنيف والتوصية</th>
            </tr>
          </thead>
          <tbody>
            ${summary.priorityGroups.readyForCompletion.map((item) => `
              <tr>
                <td><b>${item.initiative.name}</b></td>
                <td>${item.initiative.district}</td>
                <td>${item.initiative.completionRate}%</td>
                <td>${item.priorityClassification.reason} | <b>التوصية:</b> ${item.recommendation}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h3 style="color:#b45309;">٢. مبادرات تحتاج متابعة 🟡 (${summary.priorityGroups.needsFollowup.length})</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>المبادرة</th>
              <th>المديرية</th>
              <th>نسبة الإنجاز</th>
              <th>سبب التصنيف والتوصية</th>
            </tr>
          </thead>
          <tbody>
            ${summary.priorityGroups.needsFollowup.map((item) => `
              <tr>
                <td><b>${item.initiative.name}</b></td>
                <td>${item.initiative.district}</td>
                <td>${item.initiative.completionRate}%</td>
                <td>${item.priorityClassification.reason} | <b>التوصية:</b> ${item.recommendation}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h3 style="color:#9f1239;">٣. مبادرات تحتاج قرار تنفيذي عاجل 🔴 (${summary.priorityGroups.needsDecision.length})</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>المبادرة</th>
              <th>المديرية</th>
              <th>نسبة الإنجاز</th>
              <th>رصيد أسمنت لم يُصرف</th>
              <th>السبب والتوصية القيادية للحسم</th>
            </tr>
          </thead>
          <tbody>
            ${summary.priorityGroups.needsDecision.map((item) => `
              <tr>
                <td><b>${item.initiative.name}</b></td>
                <td>${item.initiative.district}</td>
                <td>${item.initiative.completionRate}%</td>
                <td><b>${item.resourceEfficiency.cementUnitCreditBalance} كيس</b></td>
                <td>${item.priorityClassification.reason} | <b>القرار المطلـوب:</b> ${item.recommendation}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>مُعد التقرير: مسؤول المتابعة والإشراف م. عيسى القادري | اعتماد: قيادة محافظة إب ووحدة التدخلات التنموية المركزية</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `تقرير_مؤشرات_القرار_${selectedDistrict === 'all' ? 'محافظة_إب' : selectedDistrict.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  {/* EXPORT TO POWERPOINT HANDLER */}
  const handleExportPowerPoint = async () => {
    try {
      const PptxModule = await import('pptxgenjs');
      const PptxGenJS = (PptxModule.default || PptxModule) as any;
      const pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_16x9';

      // Slide 1: Title Slide
      const slide1 = pptx.addSlide();
      slide1.background = { color: '0F172A' };
      slide1.addText('جمهورية اليمن - قيادة محافظة إب', {
        x: 0.5, y: 0.6, w: 9.0, h: 0.5, fontSize: 13, color: '10B981', align: 'right', bold: true
      });
      slide1.addText(`عرض القرار التنموي القيادي: ${selectedDistrictLabel}`, {
        x: 0.5, y: 1.3, w: 9.0, h: 1.0, fontSize: 22, color: 'FFFFFF', align: 'right', bold: true
      });
      slide1.addText(`وحدة التدخلات التنموية المركزية | تاريخ الصدور: ${new Date().toLocaleDateString('ar-YE')}م`, {
        x: 0.5, y: 2.3, w: 9.0, h: 0.5, fontSize: 13, color: '94A3B8', align: 'right'
      });
      slide1.addTable([
        [
          { text: `إجمالي المبادرات\n${summary.totalInitiatives} مبادرة`, options: { fill: { color: '1E293B' }, color: 'FFFFFF', align: 'center', bold: true } },
          { text: `مساهمة الوحدة\n${(summary.totalUnitContribution / 1000000).toFixed(1)}M YER`, options: { fill: { color: '065F46' }, color: 'FFFFFF', align: 'center', bold: true } },
          { text: `المساهمة المجتمعية\n${(summary.totalCommunityContribution / 1000000).toFixed(1)}M YER`, options: { fill: { color: '3730A3' }, color: 'FFFFFF', align: 'center', bold: true } },
          { text: `رصيد أسمنت بانتظار الصرف\n${summary.cement.unitCreditBalance.toLocaleString('ar-YE')} كيس`, options: { fill: { color: '92400E' }, color: 'FFFFFF', align: 'center', bold: true } }
        ]
      ], { x: 0.5, y: 3.2, w: 9.0, h: 1.5, fontSize: 12 });

      // Slide 2: Materials Balance Sheet
      const slide2 = pptx.addSlide();
      slide2.background = { color: 'F8FAFC' };
      slide2.addText(`ميزان الكميات وكفاءة الموارد - ${selectedDistrictLabel}`, {
        x: 0.5, y: 0.5, w: 9.0, h: 0.6, fontSize: 18, color: '0F172A', align: 'right', bold: true
      });
      slide2.addTable([
        [
          { text: 'بيان المادة', options: { fill: { color: '0F172A' }, color: 'FFFFFF', bold: true } },
          { text: 'المعتمد الكلي', options: { fill: { color: '0F172A' }, color: 'FFFFFF', bold: true } },
          { text: 'المنصرف للموقع', options: { fill: { color: '0F172A' }, color: 'FFFFFF', bold: true } },
          { text: 'المستهلك الفعلي', options: { fill: { color: '0F172A' }, color: 'FFFFFF', bold: true } },
          { text: 'رصيد الوحدة لم يُصرف', options: { fill: { color: '0F172A' }, color: 'FFFFFF', bold: true } }
        ],
        [
          { text: 'الأسمنت (كيس)', options: { bold: true } },
          { text: summary.cement.approved.toLocaleString('ar-YE') },
          { text: summary.cement.disbursed.toLocaleString('ar-YE') },
          { text: summary.cement.used.toLocaleString('ar-YE') },
          { text: summary.cement.unitCreditBalance.toLocaleString('ar-YE'), options: { color: 'B45309', bold: true } }
        ],
        [
          { text: 'وقود الديزل (لتر)', options: { bold: true } },
          { text: summary.diesel.approved.toLocaleString('ar-YE') },
          { text: summary.diesel.disbursed.toLocaleString('ar-YE') },
          { text: summary.diesel.used.toLocaleString('ar-YE') },
          { text: summary.diesel.unitCreditBalance.toLocaleString('ar-YE'), options: { color: '0369A1', bold: true } }
        ]
      ], { x: 0.5, y: 1.3, w: 9.0, h: 2.5, fontSize: 12, border: { pt: 1, color: 'CBD5E1' } });

      // Slide 3: Executive Mind Map & Strategy
      const slide3 = pptx.addSlide();
      slide3.background = { color: 'F1F5F9' };
      slide3.addText(`الخريطة الذهنية لهيكلة القرار والتدخلات (Mind Map) - ${selectedDistrictLabel}`, {
        x: 0.5, y: 0.5, w: 9.0, h: 0.6, fontSize: 17, color: '0F172A', align: 'right', bold: true
      });
      const recsText = summary.executiveRecommendations.map((r) => `• ${r}`).join('\n');
      const achievementsText = summary.keyAchievements.map((a) => `✓ ${a}`).join('\n');
      const gapsText = summary.keyGaps.map((g) => `! ${g}`).join('\n');

      slide3.addTable([
        [
          { text: `🟢 أهم الإنجازات المحققة\n\n${achievementsText}`, options: { fill: { color: 'ECFDF5' }, color: '065F46', fontSize: 10 } },
          { text: `⚠️ الفجوات الميدانية المرصودة\n\n${gapsText}`, options: { fill: { color: 'FFF1F2' }, color: '9F1239', fontSize: 10 } },
          { text: `🎯 التوصيات والقرارات\n\n${recsText}`, options: { fill: { color: 'EFF6FF' }, color: '1E40AF', fontSize: 10 } }
        ]
      ], { x: 0.5, y: 1.3, w: 9.0, h: 3.5 });

      // Slide 4: Portal - Health Score & Field Gaps
      const slide4 = pptx.addSlide();
      slide4.background = { color: 'FFFFFF' };
      slide4.addText(`بوابة صحة المبادرات وفجوات التنفيذ الميدانية (Health & Gaps)`, {
        x: 0.5, y: 0.5, w: 9.0, h: 0.6, fontSize: 17, color: '065F46', align: 'right', bold: true
      });
      slide4.addTable([
        [
          { text: `متوسط صحة المحفظة\n${summary.healthDistribution.avgHealthScore}/100`, options: { fill: { color: '065F46' }, color: 'FFFFFF', align: 'center', bold: true } },
          { text: `🟢 أداء جيد (>=75)\n${summary.healthDistribution.good} مبادرة`, options: { fill: { color: 'D1FAE5' }, color: '065F46', align: 'center', bold: true } },
          { text: `🟡 يحتاج متابعة (50-74)\n${summary.healthDistribution.warning} مبادرة`, options: { fill: { color: 'FEF3C7' }, color: '92400E', align: 'center', bold: true } },
          { text: `🔴 أداء حرج (<50)\n${summary.healthDistribution.critical} مبادرة`, options: { fill: { color: 'FFE4E6' }, color: '9F1239', align: 'center', bold: true } }
        ]
      ], { x: 0.5, y: 1.3, w: 9.0, h: 1.2 });

      const healthSampleRows = districtFilteredInitiatives.slice(0, 4).map((init) => {
        const a = analyzeInitiative(init);
        return [
          { text: `${init.name} (${init.district})` },
          { text: `${init.completionRate}%` },
          { text: `${a.healthScore}/100` },
          { text: a.executionGap.gapStatusLabel },
          { text: a.recommendation }
        ];
      });

      slide4.addTable([
        [
          { text: 'المبادرة', options: { fill: { color: '0F172A' }, color: 'FFFFFF', bold: true } },
          { text: 'الإنجاز', options: { fill: { color: '0F172A' }, color: 'FFFFFF', bold: true } },
          { text: 'الصحة', options: { fill: { color: '0F172A' }, color: 'FFFFFF', bold: true } },
          { text: 'الفجوة الميدانية', options: { fill: { color: '0F172A' }, color: 'FFFFFF', bold: true } },
          { text: 'التوصية', options: { fill: { color: '0F172A' }, color: 'FFFFFF', bold: true } }
        ],
        ...healthSampleRows
      ], { x: 0.5, y: 2.7, w: 9.0, h: 2.1, fontSize: 9, border: { pt: 1, color: 'CBD5E1' } });

      // Slide 5: Portal - Resource Efficiency & Credit Balances
      const slide5 = pptx.addSlide();
      slide5.background = { color: 'F8FAFC' };
      slide5.addText(`بوابة كفاءة الموارد وميزان رصيد المبادرات لدى الوحدة`, {
        x: 0.5, y: 0.5, w: 9.0, h: 0.6, fontSize: 17, color: 'B45309', align: 'right', bold: true
      });

      slide5.addTable([
        [
          { text: 'المادة', options: { fill: { color: '0F172A' }, color: 'FFFFFF', bold: true } },
          { text: 'الكلي المعتمد', options: { fill: { color: '0F172A' }, color: 'FFFFFF', bold: true } },
          { text: 'المنصرف للموقع', options: { fill: { color: '0F172A' }, color: 'FFFFFF', bold: true } },
          { text: 'المستهلك الفعلي', options: { fill: { color: '0F172A' }, color: 'FFFFFF', bold: true } },
          { text: 'رصيد لم يُصرف لدى الوحدة', options: { fill: { color: 'B45309' }, color: 'FFFFFF', bold: true } }
        ],
        [
          { text: 'الأسمنت (كيس)' },
          { text: summary.cement.approved.toLocaleString('ar-YE') },
          { text: summary.cement.disbursed.toLocaleString('ar-YE') },
          { text: summary.cement.used.toLocaleString('ar-YE') },
          { text: `${summary.cement.unitCreditBalance.toLocaleString('ar-YE')} كيس`, options: { bold: true, color: 'B45309' } }
        ],
        [
          { text: 'وقود الديزل (لتر)' },
          { text: summary.diesel.approved.toLocaleString('ar-YE') },
          { text: summary.diesel.disbursed.toLocaleString('ar-YE') },
          { text: summary.diesel.used.toLocaleString('ar-YE') },
          { text: `${summary.diesel.unitCreditBalance.toLocaleString('ar-YE')} لتر`, options: { bold: true, color: '0369A1' } }
        ]
      ], { x: 0.5, y: 1.4, w: 9.0, h: 3.2, fontSize: 11, border: { pt: 1, color: 'CBD5E1' } });

      // Slide 6: Portal - Priority Classification & Decision Tiers
      const slide6 = pptx.addSlide();
      slide6.background = { color: 'FFFFFF' };
      slide6.addText(`بوابة تصنيف الأولويات والقرارات القيادية`, {
        x: 0.5, y: 0.5, w: 9.0, h: 0.6, fontSize: 17, color: '1E1B4B', align: 'right', bold: true
      });

      slide6.addTable([
        [
          { text: `🟢 جاهزة للإكمال\n${summary.priorityGroups.readyForCompletion.length} مبادرة`, options: { fill: { color: 'ECFDF5' }, color: '065F46', align: 'center', bold: true } },
          { text: `🟡 تحتاج متابعة\n${summary.priorityGroups.needsFollowup.length} مبادرة`, options: { fill: { color: 'FFFBEB' }, color: 'B45309', align: 'center', bold: true } },
          { text: `🔴 تحتاج قرار عاجل\n${summary.priorityGroups.needsDecision.length} مبادرة`, options: { fill: { color: 'FFF1F2' }, color: '9F1239', align: 'center', bold: true } }
        ]
      ], { x: 0.5, y: 1.3, w: 9.0, h: 1.2 });

      const priorityDecisionRows = summary.priorityGroups.needsDecision.slice(0, 5).map((a) => [
        { text: `${a.initiative.name} (${a.initiative.district})`, options: { bold: true } },
        { text: `${a.initiative.completionRate}%` },
        { text: `${a.resourceEfficiency.cementUnitCreditBalance} كيس` },
        { text: a.recommendation }
      ]);

      slide6.addTable([
        [
          { text: 'اسم المبادرة والمديرية', options: { fill: { color: '0F172A' }, color: 'FFFFFF', bold: true } },
          { text: 'الإنجاز', options: { fill: { color: '0F172A' }, color: 'FFFFFF', bold: true } },
          { text: 'رصيد لم يُصرف', options: { fill: { color: '0F172A' }, color: 'FFFFFF', bold: true } },
          { text: 'القرار القيادي المطلوب', options: { fill: { color: '0F172A' }, color: 'FFFFFF', bold: true } }
        ],
        ...priorityDecisionRows
      ], { x: 0.5, y: 2.7, w: 9.0, h: 2.1, fontSize: 10, border: { pt: 1, color: 'E2E8F0' } });

      pptx.writeFile({ fileName: `عرض_القرار_التنموي_${selectedDistrict === 'all' ? 'محافظة_إب' : selectedDistrict.replace(/\s+/g, '_')}.pptx` });
    } catch (err) {
      console.error('PowerPoint Export Error:', err);
      alert('حدث خطأ أثناء إنشاء عرض PowerPoint، سيتم تصدير ملف Word بدلاً منه.');
      handleExportWordDoc();
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-right" dir="rtl">
      {/* ========================================================================= */}
      {/* EXECUTIVE TOP HERO BAR */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-indigo-900/50 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full filter blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-black px-3.5 py-1 rounded-full">
                <Brain className="w-4 h-4 text-emerald-400 animate-pulse" />
                مصدر القرار: محرك القرار التنموي V1 (Intelligence Decision Engine)
              </span>
              <span className="inline-flex items-center gap-1 bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-xs font-black px-3 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                قيادة محافظة إب ووحدة التدخلات المركزية
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-snug">
              نظام استخراج مؤشرات القرار وميزان الكميات والمساهمات
            </h1>

            <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed font-medium text-justify">
              تحليل دقيق لقاعدة بيانات المبادرات التنموية لمحافظة إب والمديريات: مطابقة مساهمة وحدة التدخلات والمساهمات المجتمعية ومتابعة الكميات المعتمدة والمنصرفة والمستخدمة ورصيد المبادرات المتبقي لدى الوحدة بمرجعية الهندسة والفرز المكتبي.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setShowExecutiveReportModal(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg hover:shadow-emerald-900/30 transition-all cursor-pointer border border-emerald-400/30"
            >
              <Printer className="w-4 h-4 text-emerald-200" />
              <span>إنشاء التقرير التنفيذي للطباعة 🖨️</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-800/90 hover:bg-slate-700 text-white font-extrabold text-xs rounded-2xl border border-slate-700 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-300" />
              <span>تصدير Excel / CSV</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DISTRICT SELECTION TOOLBAR - DROPDOWN SELECT BOX (قائمة منسدلة بدلاً من التوالي) */}
        {/* ========================================================================= */}
        <div className="pt-6 border-t border-indigo-900/80 space-y-4 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30 shrink-0">
                <MapPin className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <span className="text-xs font-black text-emerald-300 block">
                  تحديد نطاق تحليل مؤشرات القرار (قائمة منسدلة):
                </span>
                <span className="text-[11px] font-medium text-slate-300">
                  اختر المديرية المطلوبة من القائمة المنسدلة لعرض مؤشرات القرار الفوري
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-xs font-bold text-emerald-200 shrink-0">
              <span>النطاق النشط:</span>
              <span className="text-amber-300 font-black">{selectedDistrictLabel}</span>
              <span className="bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-700 text-[10px] font-mono">
                {summary.totalInitiatives} مبادرة
              </span>
            </div>
          </div>

          {/* DROPDOWN SELECT CONTROL & SEARCH */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Clean Styled Select Dropdown */}
            <div className="md:col-span-8 relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-emerald-400">
                <MapPin className="w-4 h-4" />
              </div>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full pr-10 pl-10 py-3 bg-slate-900/95 hover:bg-slate-900 text-white border-2 border-emerald-500/40 hover:border-emerald-400 rounded-2xl text-xs sm:text-sm font-black focus:outline-none focus:ring-2 focus:ring-emerald-400/50 cursor-pointer shadow-lg transition-all text-right appearance-none"
              >
                <option value="all" className="bg-slate-900 text-emerald-300 font-black py-2">
                  🏛️ جميع مديريات محافظة إب بالكامل ({initiatives.length} مبادرة)
                </option>
                <option disabled className="bg-slate-800 text-slate-400">
                  ──────────────────────────────
                </option>
                {CANONICAL_DISTRICTS.map((dFullName) => {
                  const cleanD = dFullName.replace(/^مديرية\s+/, '').trim();
                  const count = districtCountsMap[cleanD] || districtCountsMap[dFullName] || 0;
                  return (
                    <option key={dFullName} value={dFullName} className="bg-slate-900 text-slate-100 py-1.5 font-bold">
                      📍 {dFullName} ({count} مبادرة مسجلة)
                    </option>
                  );
                })}
              </select>
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-emerald-400">
                <ChevronLeft className="w-4 h-4 -rotate-90" />
              </div>
            </div>

            {/* Quick Filter Search Input for Direct Typing */}
            <div className="md:col-span-4 relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="تصفية وسرعة البحث عن مديرية..."
                onChange={(e) => {
                  const query = e.target.value.trim().toLowerCase();
                  if (!query) return;
                  const matched = CANONICAL_DISTRICTS.find(
                    (d) =>
                      d.toLowerCase().includes(query) ||
                      d.replace(/^مديرية\s+/, '').toLowerCase().includes(query)
                  );
                  if (matched) setSelectedDistrict(matched);
                }}
                className="w-full pr-10 pl-3 py-3 bg-slate-900/80 text-white border border-slate-700 hover:border-slate-600 rounded-2xl text-xs font-bold focus:outline-none focus:border-emerald-500 placeholder-slate-500"
              />
            </div>
          </div>
        </div>

        {/* NAVIGATION SUB-TABS */}
        <div className="pt-4 border-t border-indigo-900/60 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('official_decisions')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              activeTab === 'official_decisions'
                ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300'
                : 'bg-amber-950/60 text-amber-300 hover:bg-amber-900/80 border border-amber-800/60'
            }`}
          >
            <Target className="w-4 h-4 text-amber-300" />
            <span>سجل القرارات القيادية (decisions) ⚖️</span>
          </button>

          <button
            onClick={() => setActiveTab('executive_command')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              activeTab === 'executive_command'
                ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/30'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-emerald-300" />
            <span>مركز القيادة التنموي الذكي (V5) 🏛️</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/30'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>لوحة مؤشرات الميزان والرصيد</span>
          </button>

          <button
            onClick={() => setActiveTab('health_and_gaps')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              activeTab === 'health_and_gaps'
                ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/30'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Gauge className="w-4 h-4" />
            <span>صحة المبادرات وفجوات الميدان</span>
          </button>

          <button
            onClick={() => setActiveTab('resources')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              activeTab === 'resources'
                ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/30'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>كفاءة الموارد ورصيد الوحدة</span>
          </button>

          <button
            onClick={() => setActiveTab('five_tier_matrix')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              activeTab === 'five_tier_matrix'
                ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/30'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Target className="w-4 h-4 text-emerald-300" />
            <span>مصفوفة تصنيف الحالات والحلول التنموية 🎯</span>
          </button>

          <button
            onClick={() => setActiveTab('priority_list')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              activeTab === 'priority_list'
                ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/30'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>تصنيف الأولويات والقرارات</span>
          </button>

          <button
            onClick={() => setActiveTab('enhanced_table')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              activeTab === 'enhanced_table'
                ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/30'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>الجدول التفصيلي للبيانات الدقيقة</span>
          </button>

          <button
            onClick={() => setActiveTab('leadership_summary')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              activeTab === 'leadership_summary'
                ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/30'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>ملخص التوصيات والتقرير القيادي</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 0.0: OFFICIAL DECISIONS COLLECTION CENTER */}
      {/* ========================================================================= */}
      {activeTab === 'official_decisions' && (
        <DecisionsCollectionCenter
          initiatives={initiatives}
          onSelectInitiative={onSelectInitiative}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 0: SMART EXECUTIVE COMMAND PORTAL (V5) */}
      {/* ========================================================================= */}
      {activeTab === 'executive_command' && (
        <SmartExecutiveCommandPortal
          initiatives={initiatives}
          onSelectInitiative={onSelectInitiative}
          targetInitiativeId={targetInitiativeId}
          onUpdateInitiative={onUpdateInitiative}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 1: EXECUTIVE DASHBOARD & BALANCE SHEET */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Executive Scope Header Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-4 text-emerald-950">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm font-black">
                📍
              </div>
              <div>
                <span className="text-xs font-extrabold text-emerald-800 block">نطاق بيانات التحليل التنموي للقرار الحالي:</span>
                <h3 className="text-base font-black text-slate-900">{selectedDistrictLabel}</h3>
              </div>
            </div>
            <span className="text-xs font-extrabold bg-emerald-100 text-emerald-900 px-3 py-1.5 rounded-xl border border-emerald-300 font-mono">
              {summary.totalInitiatives} مبادرة
            </span>
          </div>

          {/* Executive Primary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* KPI 1: Total Initiatives & Completion */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>إجمالي المبادرات</span>
                <Building className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {summary.totalInitiatives} <span className="text-xs font-bold text-slate-500">مبادرة</span>
              </div>
              <div className="text-[11px] text-emerald-700 font-bold">
                متوسط الإنجاز: <span className="font-mono text-sm">{summary.avgCompletionRate}%</span>
              </div>
            </div>

            {/* KPI 2: Central Unit Contribution */}
            <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-xs space-y-2 bg-gradient-to-b from-emerald-50/40 to-white">
              <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
                <span>مساهمة وحدة التدخلات</span>
                <Wallet className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="text-xl font-black text-emerald-950 font-mono">
                {summary.totalUnitContribution >= 1000000000
                  ? `${(summary.totalUnitContribution / 1000000000).toFixed(2)}B`
                  : summary.totalUnitContribution >= 1000000
                  ? `${(summary.totalUnitContribution / 1000000).toFixed(1)}M`
                  : summary.totalUnitContribution.toLocaleString('ar-YE')}{' '}
                <span className="text-xs font-normal text-slate-500">YER</span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                تمويلي واحتساب الأسمنت/الديزل
              </div>
            </div>

            {/* KPI 3: Community Contribution */}
            <div className="bg-white border border-indigo-200 rounded-2xl p-4 shadow-xs space-y-2 bg-gradient-to-b from-indigo-50/40 to-white">
              <div className="flex items-center justify-between text-indigo-800 text-xs font-bold">
                <span>المساهمة المجتمعية</span>
                <Coins className="w-4 h-4 text-indigo-700" />
              </div>
              <div className="text-xl font-black text-indigo-950 font-mono">
                {summary.totalCommunityContribution >= 1000000000
                  ? `${(summary.totalCommunityContribution / 1000000000).toFixed(2)}B`
                  : summary.totalCommunityContribution >= 1000000
                  ? `${(summary.totalCommunityContribution / 1000000).toFixed(1)}M`
                  : summary.totalCommunityContribution.toLocaleString('ar-YE')}{' '}
                <span className="text-xs font-normal text-slate-500">YER</span>
              </div>
              <div className="text-[10px] text-indigo-700 font-bold">
                نقدي + عيني مواد وأعمال
              </div>
            </div>

            {/* Executive Unit Policy Callout Banner */}
            <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 text-xs space-y-2 text-slate-800 shadow-2xs">
              <div className="flex items-center gap-2 text-amber-950 font-black text-sm">
                <Info className="w-4 h-4 text-amber-700 shrink-0" />
                <span>المحدد التشغيلي لحساب كميات الأسمنت ورصيد الوحدة (وفق سياسة التثبت والدفع):</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed">
                <div className="bg-white/90 p-3 rounded-xl border border-amber-200/60 shadow-2xs">
                  <strong className="text-emerald-900 font-extrabold block mb-1">🧱 الأسمنت المتبقي بمخازن المبادرات (الميدان):</strong>
                  هو الفارق الفعلي المباشر بين <span className="font-bold text-blue-800">الكمية المنصرفة للمبادرة</span> و <span className="font-bold text-emerald-800">الكمية المستهلكة الفعالية</span> (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800 font-bold">المنصرف - المستخدم</code>).
                </div>
                <div className="bg-white/90 p-3 rounded-xl border border-amber-200/60 shadow-2xs">
                  <strong className="text-amber-900 font-extrabold block mb-1">🏛️ الرصيد غير المنصرف لدى الوحدة التنفيذية:</strong>
                  ليس ما يتبقى بالمخازن الفزيائية للوحدة، وإنما الكميات المعتمدة التي <span className="font-bold text-amber-900">لم تُصرف بعد</span> لسياسة الصرف التدريجي (دفعات مشروطة بالتقدم الميداني والإنجاز).
                </div>
              </div>
            </div>

            {/* 5-Tier Development Matrix Quick Access Section */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 shadow-xl border border-indigo-900 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs">
                    <Target className="w-4 h-4" />
                    <span>فرز المبادرات بحسب الحالات التشغيلية والحلول التنموية المقترحة:</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white mt-1">
                    تصنيف الحالات الـ 5 المعتمدة وإجراءات التدخل القيادي
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('five_tier_matrix')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md flex items-center gap-1.5 shrink-0"
                >
                  <span>فتح مصفوفة الفرز والحلول 🎯</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                <button
                  onClick={() => {
                    setFiveCategoryFilter('not_started');
                    setActiveTab('five_tier_matrix');
                  }}
                  className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 p-3 rounded-2xl text-right transition-all cursor-pointer space-y-1 group"
                >
                  <div className="flex justify-between items-center text-xs font-black">
                    <span className="text-slate-200">⏳ 1. لم يبدأ</span>
                    <span className="font-mono bg-slate-700 text-slate-100 px-2 py-0.5 rounded-full text-xs font-bold">
                      {summary.fiveTierGroups.notStarted.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">إنجاز 0% ولم يصرف مواد</p>
                  <span className="text-[10px] text-emerald-400 font-bold block pt-1 group-hover:underline">عرض وتفعيل التحشيد ←</span>
                </button>

                <button
                  onClick={() => {
                    setFiveCategoryFilter('needs_intervention_unused_disbursed');
                    setActiveTab('five_tier_matrix');
                  }}
                  className="bg-rose-950/70 hover:bg-rose-950 border border-rose-800/80 p-3 rounded-2xl text-right transition-all cursor-pointer space-y-1 group"
                >
                  <div className="flex justify-between items-center text-xs font-black">
                    <span className="text-rose-200">🚨 2. تدخل عاجل</span>
                    <span className="font-mono bg-rose-900 text-rose-100 px-2 py-0.5 rounded-full text-xs font-bold">
                      {summary.fiveTierGroups.needsInterventionUnusedDisbursed.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-300/80 font-medium">صرف دون استخدام / خطر تلف</p>
                  <span className="text-[10px] text-rose-300 font-bold block pt-1 group-hover:underline">تدوير المواد والتوجيه ←</span>
                </button>

                <button
                  onClick={() => {
                    setFiveCategoryFilter('active_needs_next_tranche');
                    setActiveTab('five_tier_matrix');
                  }}
                  className="bg-blue-950/70 hover:bg-blue-950 border border-blue-800/80 p-3 rounded-2xl text-right transition-all cursor-pointer space-y-1 group"
                >
                  <div className="flex justify-between items-center text-xs font-black">
                    <span className="text-blue-200">⚡ 3. تتطلب الدفعة التالية</span>
                    <span className="font-mono bg-blue-900 text-blue-100 px-2 py-0.5 rounded-full text-xs font-bold">
                      {summary.fiveTierGroups.activeNeedsNextTranche.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-300/80 font-medium">استهلكت المنصرف + رصيد بالوحدة</p>
                  <span className="text-[10px] text-blue-300 font-bold block pt-1 group-hover:underline">صرف الدفعة المستحقة ←</span>
                </button>

                <button
                  onClick={() => {
                    setFiveCategoryFilter('active_fully_disbursed');
                    setActiveTab('five_tier_matrix');
                  }}
                  className="bg-purple-950/70 hover:bg-purple-950 border border-purple-800/80 p-3 rounded-2xl text-right transition-all cursor-pointer space-y-1 group"
                >
                  <div className="flex justify-between items-center text-xs font-black">
                    <span className="text-purple-200">📦 4. مستلمة بالكامل + مستمرة</span>
                    <span className="font-mono bg-purple-900 text-purple-100 px-2 py-0.5 rounded-full text-xs font-bold">
                      {summary.fiveTierGroups.activeFullyDisbursed.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-300/80 font-medium">استلمت 100% ورصيد الوحدة 0</p>
                  <span className="text-[10px] text-purple-300 font-bold block pt-1 group-hover:underline">متابعة إكمال العمل ←</span>
                </button>

                <button
                  onClick={() => {
                    setFiveCategoryFilter('completed_with_unit_credit');
                    setActiveTab('five_tier_matrix');
                  }}
                  className="bg-teal-950/70 hover:bg-teal-950 border border-teal-800/80 p-3 rounded-2xl text-right transition-all cursor-pointer space-y-1 group"
                >
                  <div className="flex justify-between items-center text-xs font-black">
                    <span className="text-teal-200">🎯 5. منجزة + وفر بالوحدة</span>
                    <span className="font-mono bg-teal-900 text-teal-100 px-2 py-0.5 rounded-full text-xs font-bold">
                      {summary.fiveTierGroups.completedWithUnitCredit.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-teal-300/80 font-medium">منجزة ميدانياً وفر اعتمادي</p>
                  <span className="text-[10px] text-teal-300 font-bold block pt-1 group-hover:underline">اعتماد الوفر الاعتمادي ←</span>
                </button>

                <button
                  onClick={() => {
                    setFiveCategoryFilter('fully_completed_and_disbursed');
                    setActiveTab('five_tier_matrix');
                  }}
                  className="bg-emerald-950/70 hover:bg-emerald-950 border border-emerald-800/80 p-3 rounded-2xl text-right transition-all cursor-pointer space-y-1 group"
                >
                  <div className="flex justify-between items-center text-xs font-black">
                    <span className="text-emerald-200">🏁 6. منجزة ومستلمة بالكامل</span>
                    <span className="font-mono bg-emerald-900 text-emerald-100 px-2 py-0.5 rounded-full text-xs font-bold">
                      {summary.fiveTierGroups.fullyCompletedAndDisbursed.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-300/80 font-medium">مكتملة ومستوفية للشروط</p>
                  <span className="text-[10px] text-emerald-300 font-bold block pt-1 group-hover:underline">شهادة الاستلام النهائي ←</span>
                </button>
              </div>
            </div>

            {/* KPI 4: Cement Credit Balance at Unit */}
            <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-xs space-y-2 bg-gradient-to-b from-amber-50/40 to-white">
              <div className="flex items-center justify-between text-amber-800 text-xs font-bold">
                <span>رصيد الأسمنت لدى الوحدة</span>
                <PackageCheck className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl font-black text-amber-950 font-mono">
                {summary.cement.unitCreditBalance.toLocaleString('ar-YE')}{' '}
                <span className="text-xs font-bold text-slate-500">كيس</span>
              </div>
              <div className="text-[10px] text-slate-600 font-bold">
                معتمد لم يصرف بعد
              </div>
            </div>

            {/* KPI 5: Cement Field Storage Balance */}
            <div className="bg-white border border-teal-200 rounded-2xl p-4 shadow-xs space-y-2 bg-gradient-to-b from-teal-50/40 to-white">
              <div className="flex items-center justify-between text-teal-800 text-xs font-bold">
                <span>المتبقي بالمخزن الميداني</span>
                <Building className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-xl font-black text-teal-950 font-mono">
                {summary.cement.remaining.toLocaleString('ar-YE')}{' '}
                <span className="text-xs font-bold text-slate-500">كيس</span>
              </div>
              <div className="text-[10px] text-teal-700 font-bold">
                منصرف بالموقع لم يُستهلك
              </div>
            </div>

            {/* KPI 6: Diesel Balance at Unit */}
            <div className="bg-white border border-sky-200 rounded-2xl p-4 shadow-xs space-y-2 bg-gradient-to-b from-sky-50/40 to-white">
              <div className="flex items-center justify-between text-sky-800 text-xs font-bold">
                <span>رصيد الديزل لدى الوحدة</span>
                <Fuel className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-xl font-black text-sky-950 font-mono">
                {summary.diesel.unitCreditBalance.toLocaleString('ar-YE')}{' '}
                <span className="text-xs font-bold text-slate-500">لتر</span>
              </div>
              <div className="text-[10px] text-sky-800 font-bold">
                معتمد بانتظار صرف المعدات
              </div>
            </div>
          </div>

          {/* DETAILED MATERIALS & QUANTITIES BALANCE CARD */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cement Balance Summary Box */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-emerald-600" />
                  ميزان الأسمنت المعتمد والمنصرف والمستخدم ورصيد المبادرات
                </h3>
                <span className="text-xs font-black bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full font-mono">
                  كفاءة الاستهلاك: {summary.cement.efficiencyPct}%
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[11px] text-slate-500 font-bold block">المعتمد الكلي</span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    {summary.cement.approved.toLocaleString('ar-YE')}
                  </span>
                  <span className="text-[10px] text-slate-400 block">كيس</span>
                </div>

                <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100 space-y-1">
                  <span className="text-[11px] text-blue-700 font-bold block">المنصرف للموقع</span>
                  <span className="text-base font-black text-blue-900 font-mono">
                    {summary.cement.disbursed.toLocaleString('ar-YE')}
                  </span>
                  <span className="text-[10px] text-blue-500 block">كيس</span>
                </div>

                <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100 space-y-1">
                  <span className="text-[11px] text-emerald-700 font-bold block">المستهلك بالرصف</span>
                  <span className="text-base font-black text-emerald-900 font-mono">
                    {summary.cement.used.toLocaleString('ar-YE')}
                  </span>
                  <span className="text-[10px] text-emerald-600 block">كيس</span>
                </div>

                <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 space-y-1">
                  <span className="text-[11px] text-amber-800 font-black block">رصيد لدى الوحدة</span>
                  <span className="text-base font-black text-amber-950 font-mono">
                    {summary.cement.unitCreditBalance.toLocaleString('ar-YE')}
                  </span>
                  <span className="text-[10px] text-amber-700 block">كيس لم يُصرف</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 flex justify-between items-center">
                <span>رصيد الأسمنت المتبقي في المخازن الميدانية للمبادرات:</span>
                <span className="font-mono font-black text-emerald-800 text-sm">{summary.cement.remaining.toLocaleString('ar-YE')} كيس</span>
              </div>
            </div>

            {/* Diesel Balance Summary Box */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Fuel className="w-5 h-5 text-sky-600" />
                  ميزان وقود الديزل للمعدات ورصيد المبادرات لدى الوحدة
                </h3>
                <span className="text-xs font-black bg-sky-100 text-sky-900 px-2.5 py-0.5 rounded-full font-mono">
                  كفاءة الاستهلاك: {summary.diesel.efficiencyPct}%
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[11px] text-slate-500 font-bold block">المعتمد الكلي</span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    {summary.diesel.approved.toLocaleString('ar-YE')}
                  </span>
                  <span className="text-[10px] text-slate-400 block">لتر</span>
                </div>

                <div className="bg-sky-50/70 p-3 rounded-xl border border-sky-100 space-y-1">
                  <span className="text-[11px] text-sky-700 font-bold block">المنصرف للمعدات</span>
                  <span className="text-base font-black text-sky-900 font-mono">
                    {summary.diesel.disbursed.toLocaleString('ar-YE')}
                  </span>
                  <span className="text-[10px] text-sky-500 block">لتر</span>
                </div>

                <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 space-y-1">
                  <span className="text-[11px] text-indigo-700 font-bold block">المستهلك بالعمل</span>
                  <span className="text-base font-black text-indigo-900 font-mono">
                    {summary.diesel.used.toLocaleString('ar-YE')}
                  </span>
                  <span className="text-[10px] text-indigo-600 block">لتر</span>
                </div>

                <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 space-y-1">
                  <span className="text-[11px] text-amber-800 font-black block">رصيد لدى الوحدة</span>
                  <span className="text-base font-black text-amber-950 font-mono">
                    {summary.diesel.unitCreditBalance.toLocaleString('ar-YE')}
                  </span>
                  <span className="text-[10px] text-amber-700 block">لتر لم يُصرف</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 flex justify-between items-center">
                <span>رصيد الوقود المتبقي في خزان الموقع للمبادرات:</span>
                <span className="font-mono font-black text-sky-800 text-sm">{summary.diesel.remaining.toLocaleString('ar-YE')} لتر</span>
              </div>
            </div>
          </div>

          {/* Visual Recharts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Technical Work Quantities */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  مقارنة الأعمال الفنية المعتمدة بحسب الدراسات بالأعمال المنفذة
                </h3>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                    <Bar dataKey="المعتمد" fill="#94a3b8" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="المنفذ" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Materials Allocation & Unit Credit Balance */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-indigo-600" />
                  توزيع صحة المبادرات النطاق الحالي (مؤشر الـ 100 نقطة)
                </h3>
              </div>

              <div className="h-72 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={healthPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {healthPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HEALTH SCORE & EXECUTION GAPS */}
      {/* ========================================================================= */}
      {activeTab === 'health_and_gaps' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Explanation Banner */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 text-slate-800 space-y-2">
            <h3 className="font-black text-emerald-900 text-sm flex items-center gap-2">
              <Gauge className="w-5 h-5 text-emerald-700" />
              منهجية احتساب "مؤشر صحة المبادرة" (100 نقطة) لنطاق {selectedDistrictLabel}:
            </h3>
            <p className="text-xs leading-relaxed text-slate-700 font-medium text-justify">
              يتم احتساب المؤشر آلياً وفق الأوزان النسبية الرياضية:
              <strong className="text-emerald-800"> نسبة الإنجاز (30 نقطة)</strong> +
              <strong className="text-emerald-800"> مطابقة التنفيذ للاعتماد الهيكلي (25 نقطة)</strong> +
              <strong className="text-emerald-800"> كفاءة استهلاك الأسمنت والديزل (20 نقطة)</strong> +
              <strong className="text-emerald-800"> مساهمة الوحدة للنتيجة (15 نقطة)</strong> +
              <strong className="text-emerald-800"> وجود المساهمة المجتمعية (10 نقاط)</strong>.
            </p>
          </div>

          {/* Filters Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-xs">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  placeholder="ابحث باسم المبادرة أو العزلة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <select
                value={healthFilter}
                onChange={(e) => setHealthFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">كافة نطاقات الصحة</option>
                <option value="good">🟢 أداء جيد وقابل للاستمرار (&gt;=75)</option>
                <option value="warning">🟡 يحتاج متابعة (50 - 74)</option>
                <option value="critical">🔴 يحتاج قرار أو مراجعة (&lt;50)</option>
              </select>
            </div>

            <span className="text-xs font-bold text-slate-500">
              عرض {filteredAnalyses.length} من أصل {districtFilteredInitiatives.length} مبادرة
            </span>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAnalyses.map((item) => {
              const init = item.initiative;
              return (
                <div
                  key={init.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 block">
                          {init.district} - {init.subDistrict}
                        </span>
                        <h4 className="font-black text-slate-900 text-sm line-clamp-1">{init.name}</h4>
                      </div>
                      <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black border ${item.healthBadgeClass}`}>
                        {item.healthScore}/100
                      </span>                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                        <span>نسبة الإنجاز:</span>
                        <span className="text-slate-900 font-mono">{init.completionRate || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-2 rounded-full"
                          style={{ width: `${init.completionRate || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Financials & Material Credit */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 block">مساهمة الوحدة:</span>
                        <span className="font-mono font-bold text-emerald-800">
                          {parseNum(init.unitContribution).toLocaleString('ar-YE')} YER
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">المجتمعية:</span>
                        <span className="font-mono font-bold text-indigo-800">
                          {parseNum(init.communityContribution).toLocaleString('ar-YE')} YER
                        </span>
                      </div>
                    </div>

                    {/* Gap status */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs">
                      <div className="flex justify-between font-bold text-slate-700">
                        <span>حالة الفجوة الميدانية:</span>
                        <span className="font-extrabold text-slate-900">{item.executionGap.gapStatusLabel}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>الأسمنت (معتمد / منصرف):</span>
                        <span className="font-mono text-slate-800 font-bold">{item.resourceEfficiency.cementAppr} / {item.resourceEfficiency.cementDisbursed} كيس</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-amber-800 font-bold">
                        <span>رصيد الأسمنت لدى الوحدة:</span>
                        <span className="font-mono">{item.resourceEfficiency.cementUnitCreditBalance} كيس</span>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 line-clamp-1">{item.recommendation}</span>
                    {onSelectInitiative && (
                      <button
                        onClick={() => onSelectInitiative(init)}
                        className="text-xs font-black text-emerald-700 hover:underline shrink-0"
                      >
                        معاينة ←
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MATRIX TAB CONTENT */}
      {activeTab === 'five_tier_matrix' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Executive Policy Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800 space-y-5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs">
                  <Target className="w-4 h-4" />
                  <span>نظام التصنيف المقارن وإدارة التدخلات التنموية الفعالة (وفق مبادئ إدارة المشاريع)</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  مصفوفة تصنيف الحالات التنموية واقتراح القرارات والحلول القيادية
                </h2>
                <p className="text-xs text-indigo-200/90 leading-relaxed font-medium">
                  تفريز دقيق لكافة المبادرات بحسب موقف الصرف، الاستهلاك الميداني، رصيد المواد غير المنصرفة لدى الوحدة، الاستهلاك الزائد، ونسبة الإنجاز المحققة.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-slate-800/90 p-3 rounded-2xl border border-slate-700 text-xs text-slate-300 font-bold shrink-0">
                <span>إجمالي نطاق [{selectedDistrictLabel}]:</span>
                <span className="font-mono text-emerald-400 font-black text-sm">{districtFilteredInitiatives.length} مبادرة</span>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-2 pt-4 border-t border-slate-800/80">
              {[
                {
                  key: 'all',
                  title: 'جميع الفئات',
                  count: districtFilteredInitiatives.length,
                  icon: '📊',
                  color: 'bg-slate-800 text-slate-200 border-slate-600'
                },
                {
                  key: 'not_started',
                  title: '1. لم يبدأ (إنجاز 0%)',
                  count: summary.fiveTierGroups.notStarted.length,
                  icon: '⏳',
                  color: 'bg-slate-800 text-slate-300 border-slate-600'
                },
                {
                  key: 'needs_intervention_unused_disbursed',
                  title: '2. تدخل عاجل (مواد غير مستخدمة)',
                  count: summary.fiveTierGroups.needsInterventionUnusedDisbursed.length,
                  icon: '🚨',
                  color: 'bg-rose-950/90 text-rose-300 border-rose-600'
                },
                {
                  key: 'active_needs_next_tranche',
                  title: '3. تطلب الدفعة التالية',
                  count: summary.fiveTierGroups.activeNeedsNextTranche.length,
                  icon: '⚡',
                  color: 'bg-blue-950/90 text-blue-300 border-blue-600'
                },
                {
                  key: 'active_fully_disbursed',
                  title: '4. مستلمة بالكامل + مستمرة',
                  count: summary.fiveTierGroups.activeFullyDisbursed.length,
                  icon: '📦',
                  color: 'bg-purple-950/90 text-purple-300 border-purple-600'
                },
                {
                  key: 'completed_with_unit_credit',
                  title: '5. منجزة + وفر بالوحدة',
                  count: summary.fiveTierGroups.completedWithUnitCredit.length,
                  icon: '🎯',
                  color: 'bg-teal-950/90 text-teal-300 border-teal-600'
                },
                {
                  key: 'fully_completed_and_disbursed',
                  title: '6. منجزة ومستلمة بالكامل',
                  count: summary.fiveTierGroups.fullyCompletedAndDisbursed.length,
                  icon: '🏁',
                  color: 'bg-emerald-950/90 text-emerald-300 border-emerald-600'
                },
                {
                  key: 'overused_cement',
                  title: '7. استهلاك أكثر من المنصرف',
                  count: summary.fiveTierGroups.overusedCement.length,
                  icon: '⚠️',
                  color: 'bg-amber-950/90 text-amber-300 border-amber-600'
                }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFiveCategoryFilter(tab.key as any)}
                  className={`p-2 rounded-2xl border text-right transition-all cursor-pointer ${
                    fiveCategoryFilter === tab.key
                      ? 'ring-2 ring-emerald-400 bg-emerald-950/90 border-emerald-400 text-white shadow-lg'
                      : `${tab.color} opacity-90 hover:opacity-100`
                  }`}
                >
                  <div className="flex justify-between items-center text-[11px] font-black mb-0.5">
                    <span className="truncate">{tab.icon} {tab.title}</span>
                    <span className="font-mono bg-black/40 px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0">
                      {tab.count}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* The Categories Breakdown Section */}
          <div className="space-y-8">
            {[
              {
                key: 'not_started' as any,
                title: 'الحالة الأولى: المبادرات التي لم يصرف لها ونسبة إنجازها صفر (تحت مسمى: لم يبدأ ⏳)',
                badge: 'لم يبدأ ⏳',
                badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
                borderClass: 'border-slate-400',
                bgHeader: 'bg-slate-50 border-slate-200 text-slate-900',
                items: summary.fiveTierGroups.notStarted,
                definition: 'مبادرات معتمدة لم تبدأ أعمالها الميدانية بعد (نسبة إنجاز 0%) ولم تُصرف لها أي كميات من الوحدة التنفيذية.',
                intervention: 'تفعيل التحشيد المجتمعي عبر الفرسان والتنسيق مع اللجنة المحلية لتجهيز موقع العمل، وإعطاء مهلة 30 يوماً للتنفيذ وإلا يتم سحب الاعتماد وتوجيهه لمبادرة مجاورة تفادياً لتجميد الميزانية.'
              },
              {
                key: 'needs_intervention_unused_disbursed' as any,
                title: 'الحالة الثانية: مبادرات تم الصرف لها ولم تستخدم الكمية المنصرفة (تحتاج تدخل عاجل للحل 🚨)',
                badge: 'تدخل عاجل 🚨',
                badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
                borderClass: 'border-rose-600',
                bgHeader: 'bg-rose-50 border-rose-200 text-rose-950',
                items: summary.fiveTierGroups.needsInterventionUnusedDisbursed,
                definition: 'تم صرف أسمنت/ديزل للمبادرة، لكن الكمية الميدانية غير مستخدمة أو متكدسة بالمخازن مع تعثر وتدني الإنجاز مما يعرض المواد لتصلف الرطوبة.',
                intervention: 'تشكيل لجنة نزول ومتابعة ميدانية فورية للتحقق من سلامة الأسمنت المخزون وتوجيه إنذار للجنة، وفي حال عدم الاستجابة يتم إصدار محضر تدوير المواد (Reallocation) ونقل الأسمنت لمبادرة مجاورة نشطة.'
              },
              {
                key: 'active_needs_next_tranche' as any,
                title: 'الحالة الثالثة: مبادرات استخدمت المنصرف كاملاً ويتبقى لديها رصيد عند الوحدة (جاهزة للدفعة التالية ⚡)',
                badge: 'تتطلب الدفعة التالية ⚡',
                badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
                borderClass: 'border-blue-600',
                bgHeader: 'bg-blue-50 border-blue-200 text-blue-950',
                items: summary.fiveTierGroups.activeNeedsNextTranche,
                definition: 'مبادرات جارية استهلكت كامل الكمية المنصرفة لها بالموقع بنجاح وتواصل العمل، وتطالب بتوريد الدفعة المستحقة من رصيدها المتبقي لدى الوحدة.',
                intervention: 'المصادقة الفورية على محاضر المعاينة المرحلية وصرف الدفعة التالية لمواصلة أعمال الرصف الخرساني وتفادي توقف العمالة المجتمعية.'
              },
              {
                key: 'completed_with_unit_credit' as any,
                title: 'الحالة الرابعة: مبادرات منجزة ميدانياً ويتبقى لدى الوحدة رصيد (وفر اعتمادي 🎯)',
                badge: 'منجزة + وفر بالوحدة 🎯',
                badgeClass: 'bg-teal-100 text-teal-900 border-teal-300',
                borderClass: 'border-teal-600',
                bgHeader: 'bg-teal-50 border-teal-200 text-teal-950',
                items: summary.fiveTierGroups.completedWithUnitCredit,
                definition: 'أنجزت المبادرة كامل أعمال الرصف ميدانياً بنجاح (إنجاز ≥ 90%) دون الحاجة لاستكمال كافة الكمية المعتمدة، وحققت وفراً اعتماديّاً لم يُصرف لدى الوحدة.',
                intervention: 'إجراء الاستلام الهندسي النهائي والتسوية الماليّة والمخزنية، وتسجيل الوفر الاعتمادي رسمياً لإعادة تخصيصه لدعم مبادرات أخرى بحاجة ماسة بالمديرية.'
              },
              {
                key: 'fully_completed_and_disbursed' as any,
                title: 'الحالة الخامسة: مبادرات منجزة كلياً واستلمت كامل الكمية واستخدمتها بالكامل (إغلاق تنموي آمن 🏁)',
                badge: 'إغلاق آمن 🏁',
                badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                borderClass: 'border-emerald-600',
                bgHeader: 'bg-emerald-50 border-emerald-200 text-emerald-950',
                items: summary.fiveTierGroups.fullyCompletedAndDisbursed,
                definition: 'مبادرة مستوفية لكافة الشروط والمتطلبات بنسبة 100%، تم استلام واستغلال كامل الحصة المعتمدة بنجاح طبقا للمواصفات الهندسيّة.',
                intervention: 'إصدار شهادة الاستلام النهائي للمشروع وتوثيق قصة النجاح، وتشكيل لجنة صيانة مجتمعية دورية لحماية الطريق والمنشآت.'
              },
              {
                key: 'overused_cement' as any,
                title: 'الحالة السادسة: مبادرات استهلكت كميات أسمنت أكثر من المنصرف لها من الوحدة (استهلاك زائد / مساهمات مجتمعية إضافية ⚠️)',
                badge: 'استهلاك زائد ⚠️',
                badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
                borderClass: 'border-amber-600',
                bgHeader: 'bg-amber-50 border-amber-200 text-amber-950',
                items: summary.fiveTierGroups.overusedCement,
                definition: 'استهلكت المبادرة كمية أسمنت في الميدان تتجاوز الكمية المنصرفة لها من الوحدة، إما بجهود ومساهمات مجتمعية ذاتية إضافية أو شراء/استقراض مواد لمواصلة الأعمال.',
                intervention: 'معاينة الموقع رسمياً وتثبيت كميات الإنجاز الفعلي، وإصدار قرار بتعويض أو مطابقة الكميات من رصيد المبادرة غير المنصرف لدى الوحدة التنفيذية تشجيعاً للمبادرة.'
              }
            ]
              .filter((cat) => fiveCategoryFilter === 'all' || fiveCategoryFilter === cat.key)
              .map((cat) => (
                <div
                  key={cat.key}
                  className={`bg-white border-2 rounded-3xl p-6 shadow-sm space-y-5 ${cat.borderClass}`}
                >
                  {/* Category Header */}
                  <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${cat.bgHeader}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-black border ${cat.badgeClass}`}>
                          {cat.badge}
                        </span>
                        <span className="text-xs font-extrabold text-slate-500">
                          عدد المبادرات: ({cat.items.length})
                        </span>
                      </div>
                      <h3 className="text-base font-black mt-2 text-slate-900">{cat.title}</h3>
                    </div>
                  </div>

                  {/* Definition & Intervention Guidelines Box */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                      <strong className="text-slate-900 font-black block">📖 التشخيص الفني والمفهوم التنموي:</strong>
                      <p className="text-slate-700 leading-relaxed font-medium">{cat.definition}</p>
                    </div>

                    <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-1">
                      <strong className="text-emerald-950 font-black block">💡 مقترح التدخل الفوري وفق أسس التنمية:</strong>
                      <p className="text-emerald-900 leading-relaxed font-medium">{cat.intervention}</p>
                    </div>
                  </div>

                  {/* Initiatives List under this Category */}
                  {cat.items.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 font-bold text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      لا توجد مبادرات تنموية في هذه الفئة ضمن نطاق [{selectedDistrictLabel}] الحالي.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {cat.items.map((analysis) => {
                        const init = analysis.initiative;
                        return (
                          <div
                            key={init.id}
                            className="bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-4 transition-all shadow-xs space-y-3"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span className="text-[10px] font-black text-slate-400 block">
                                  {init.district} - {init.subDistrict}
                                </span>
                                <h4 className="font-black text-slate-900 text-xs sm:text-sm line-clamp-1">{init.name}</h4>
                              </div>
                              <span className="px-2.5 py-1 rounded-xl text-[11px] font-mono font-black bg-slate-200 text-slate-800">
                                إنجاز: {init.completionRate || 0}%
                              </span>
                            </div>

                            {/* Cement Numbers Breakdown */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-center bg-white p-2.5 rounded-xl border border-slate-200 font-mono">
                              <div>
                                <span className="text-[10px] text-slate-400 block font-sans">معتمد كلي</span>
                                <span className="font-bold text-slate-800">{analysis.resourceEfficiency.cementAppr}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-blue-600 block font-sans">منصرف</span>
                                <span className="font-bold text-blue-900">{analysis.resourceEfficiency.cementDisbursed}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-emerald-600 block font-sans">مستهلك</span>
                                <span className="font-bold text-emerald-900">{analysis.resourceEfficiency.cementUsed}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-amber-700 block font-sans">رصيد بالوحدة</span>
                                <span className="font-black text-amber-900">{analysis.resourceEfficiency.cementUnitCreditBalance}</span>
                              </div>
                            </div>

                            {/* Field Remaining warning if any */}
                            {analysis.resourceEfficiency.cementRemaining > 0 && (
                              <div className="bg-amber-50 p-2 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex justify-between font-extrabold">
                                <span>📦 الأسمنت المتبقي بمخزن المبادرة الميداني (منصرف - مستهلك):</span>
                                <span className="font-mono text-amber-950 font-black">{analysis.resourceEfficiency.cementRemaining} كيس</span>
                              </div>
                            )}

                            {/* Overused cement alert if any */}
                            {analysis.resourceEfficiency.isCementOverused && (
                              <div className="bg-amber-100/80 p-2 rounded-xl border border-amber-300 text-[11px] text-amber-950 flex justify-between font-extrabold">
                                <span>⚠️ استهلاك زائد عن المنصرف من الوحدة:</span>
                                <span className="font-mono text-amber-950 font-black">+{analysis.resourceEfficiency.cementOverused} كيس</span>
                              </div>
                            )}

                            {/* Tailored proposal for this initiative */}
                            <div className="text-[11px] text-slate-700 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/80 leading-relaxed font-medium">
                              <strong className="text-emerald-950 font-bold block mb-0.5">🎯 الإجراء التنموي المقترح:</strong>
                              {analysis.fiveTierClassification.interventionProposal}
                            </div>

                            {onSelectInitiative && (
                              <button
                                onClick={() => onSelectInitiative(init)}
                                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <span>معاينة السجل الهيكلي الكامل للمبادرة</span>
                                <ArrowLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: RESOURCE EFFICIENCY & UNIT CREDIT BALANCES */}
      {/* ========================================================================= */}
      {activeTab === 'resources' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Resource Status Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Category 1: Effective Usage */}
            <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-xs space-y-2 border-r-4 border-r-emerald-600">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800">✅ استخدام فعال للموارد</span>
                <span className="text-xs font-black bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full">
                  {initiativeAnalyses.filter((a) => a.resourceEfficiency.pattern === 'effective').length} مبادرة
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                مبادرات يتطابق فيها استهلاك الأسمنت والديزل مع نسبة الإنجاز المحققة دون هدر.
              </p>
            </div>

            {/* Category 2: Remaining Resources Needing Reallocation */}
            <div className="bg-white border border-sky-200 rounded-2xl p-5 shadow-xs space-y-2 border-r-4 border-r-sky-600">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-800">🔄 موارد متبقية بالموقع</span>
                <span className="text-xs font-black bg-sky-100 text-sky-900 px-2.5 py-0.5 rounded-full">
                  {initiativeAnalyses.filter((a) => a.resourceEfficiency.pattern === 'surplus_reallocate').length} مبادرة
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                مبادرات شارفت على الانتهاء وتركت كميات أسمنت بالمخزن الميداني تتطلب حسم الأعمال.
              </p>
            </div>

            {/* Category 3: High Disbursement vs Low Execution */}
            <div className="bg-white border border-rose-200 rounded-2xl p-5 shadow-xs space-y-2 border-r-4 border-r-rose-600">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800">⚠️ صرف مرتفع مقابل إنجاز منخفض</span>
                <span className="text-xs font-black bg-rose-100 text-rose-900 px-2.5 py-0.5 rounded-full">
                  {initiativeAnalyses.filter((a) => a.resourceEfficiency.pattern === 'high_cost_low_exec').length} مبادرة
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                مبادرات استلمت مواد ولكن نسبة الإنجاز ما زالت متدنية وتطلب مراجعة تنفيدية.
              </p>
            </div>
          </div>

          {/* Detailed Materials Table with Credit Balances */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-600" />
                كشف المبادرات ورصيد الأسمنت والديزل المتبقي لدى الوحدة وبالمخازن الميدانية ({selectedDistrictLabel})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                  <tr>
                    <th className="p-3">المبادرة والمديرية</th>
                    <th className="p-3">الإنجاز</th>
                    <th className="p-3">مساهمة الوحدة YER</th>
                    <th className="p-3">الأسمنت المعتمد</th>
                    <th className="p-3 text-blue-900">الأسمنت المنصرف</th>
                    <th className="p-3 font-black text-amber-900" title="لم يُصرف بعد لسياسة التثبت والدفع وفق التقدم">رصيد الوحدة لم يُصرف</th>
                    <th className="p-3 font-black text-emerald-900" title="مخزون موقع المبادرة = المنصرف - المستهلك الفعلي">متبقي بمخزن المبادرة</th>
                    <th className="p-3">الديزل المعتمد</th>
                    <th className="p-3 text-sky-900">الديزل المنصرف</th>
                    <th className="p-3 font-black text-amber-900" title="لم يُصرف بعد لسياسة صرف المعدات وفق النشاط">رصيد ديزل لم يُصرف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredAnalyses.map((a) => {
                    const init = a.initiative;
                    return (
                      <tr key={init.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-bold">
                          <div>{init.name}</div>
                          <span className="text-[10px] text-slate-400 font-normal">{init.district} - {init.subDistrict}</span>
                        </td>
                        <td className="p-3 font-mono font-bold">{init.completionRate || 0}%</td>
                        <td className="p-3 font-mono text-emerald-800 font-bold">
                          {parseNum(init.unitContribution).toLocaleString('ar-YE')}
                        </td>
                        <td className="p-3 font-mono">{a.resourceEfficiency.cementAppr} كيس</td>
                        <td className="p-3 font-mono text-blue-700">
                          <div>{a.resourceEfficiency.cementDisbursed} كيس</div>
                          {a.resourceEfficiency.cementDisbursed > a.resourceEfficiency.cementAppr && a.resourceEfficiency.cementAppr > 0 && (
                            <span className="text-[9px] font-black bg-amber-100 text-amber-900 px-1 py-0.5 rounded block w-max mt-0.5" title="صرف إسمنت فوق المعتمد">
                              ⚠️ فوق المعتمد (+{a.resourceEfficiency.cementDisbursed - a.resourceEfficiency.cementAppr})
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-amber-800 font-black bg-amber-50/50">
                          {a.resourceEfficiency.cementUnitCreditBalance} كيس
                        </td>
                        <td className="p-3 font-mono text-emerald-700 font-bold">
                          {a.resourceEfficiency.cementRemaining} كيس
                        </td>
                        <td className="p-3 font-mono">{a.resourceEfficiency.dieselAppr} لتر</td>
                        <td className="p-3 font-mono text-sky-700">
                          <div>{a.resourceEfficiency.dieselDisbursed} لتر</div>
                          {a.resourceEfficiency.dieselDisbursed > a.resourceEfficiency.dieselAppr && a.resourceEfficiency.dieselAppr > 0 && (
                            <span className="text-[9px] font-black bg-amber-100 text-amber-900 px-1 py-0.5 rounded block w-max mt-0.5" title="صرف ديزل فوق المعتمد">
                              ⚠️ فوق المعتمد (+{a.resourceEfficiency.dieselDisbursed - a.resourceEfficiency.dieselAppr})
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-amber-800 font-black bg-amber-50/50">
                          {a.resourceEfficiency.dieselUnitCreditBalance} لتر
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

      {/* ========================================================================= */}
      {/* TAB 4: PRIORITY INITIATIVES LIST */}
      {/* ========================================================================= */}
      {activeTab === 'priority_list' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Executive Priority Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Priority for Closure */}
            <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white p-4 rounded-2xl border border-emerald-500/40 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  أولوية للإغلاق والحسم (80%+ إنجاز)
                </span>
                <span className="text-xs font-mono font-black bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                  {summary.priorityGroups.readyForCompletion.length} مبادرة
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium leading-snug">
                مبادرات بلغت مراحل متقدمة وتتطلب نزول هندسي استلامي لحسم الأعمال واستكمال وثائق الإغلاق النهائي.
              </p>
              <div className="pt-2 border-t border-emerald-800/60 flex items-center justify-between text-[10px] font-bold text-emerald-200">
                <span>رصيد الأسمنت المتبقي بالمواقع:</span>
                <span className="font-mono text-xs text-white">
                  {summary.priorityGroups.readyForCompletion.reduce((s, i) => s + i.resourceEfficiency.cementRemaining, 0).toLocaleString('ar-YE')} كيس
                </span>
              </div>
            </div>

            {/* Card 2: Priority for Direct Intervention */}
            <div className="bg-gradient-to-br from-rose-950 to-slate-900 text-white p-4 rounded-2xl border border-rose-500/40 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-rose-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  أولوية للتدخل العاجل (متعثرة/فجوة صرف)
                </span>
                <span className="text-xs font-mono font-black bg-rose-500/20 text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-500/40">
                  {summary.priorityGroups.needsDecision.length} مبادرة
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium leading-snug">
                مبادرات متعثرة أو ذات صرف مرتفع مقابل إنجاز ضعيف تستوجب قراراً قيادياً فورياً وتشكيل لجنة تدوير للمواد.
              </p>
              <div className="pt-2 border-t border-rose-800/60 flex items-center justify-between text-[10px] font-bold text-rose-200">
                <span>المواد المعرضة لمخاطر التلف:</span>
                <span className="font-mono text-xs text-white">
                  {summary.priorityGroups.needsDecision.reduce((s, i) => s + i.resourceEfficiency.cementDisbursed, 0).toLocaleString('ar-YE')} كيس مصروف
                </span>
              </div>
            </div>

            {/* Card 3: Priority for Continuous Acceleration */}
            <div className="bg-gradient-to-br from-amber-950 to-slate-900 text-white p-4 rounded-2xl border border-amber-500/40 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-amber-400" />
                  أولوية للتسريع والمتابعة (جارية)
                </span>
                <span className="text-xs font-mono font-black bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/40">
                  {summary.priorityGroups.needsFollowup.length} مبادرة
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium leading-snug">
                مبادرات ميدانية مستمرة بنسب متزنة تتطلب متابعة تحشيد المساهمة المجتمعية وتوريد المواد بانتظام.
              </p>
              <div className="pt-2 border-t border-amber-800/60 flex items-center justify-between text-[10px] font-bold text-amber-200">
                <span>متوسط نسبة الإنجاز:</span>
                <span className="font-mono text-xs text-white">
                  {summary.priorityGroups.needsFollowup.length > 0
                    ? Math.round(summary.priorityGroups.needsFollowup.reduce((s, i) => s + parseNum(i.initiative.completionRate), 0) / summary.priorityGroups.needsFollowup.length)
                    : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Priority Group Filter Header & Sorting Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
                <Filter className="w-4 h-4 text-emerald-600" />
                تصفية فئات الأولوية:
              </span>

              <button
                onClick={() => setPriorityFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  priorityFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                الكل ({districtFilteredInitiatives.length})
              </button>

              <button
                onClick={() => setPriorityFilter('ready_for_completion')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  priorityFilter === 'ready_for_completion'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                🟢 أولوية للإغلاق ({summary.priorityGroups.readyForCompletion.length})
              </button>

              <button
                onClick={() => setPriorityFilter('needs_decision')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  priorityFilter === 'needs_decision'
                    ? 'bg-rose-700 text-white'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                }`}
              >
                🔴 أولوية للتدخل ({summary.priorityGroups.needsDecision.length})
              </button>

              <button
                onClick={() => setPriorityFilter('needs_followup')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  priorityFilter === 'needs_followup'
                    ? 'bg-amber-700 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                🟡 أولوية للتسريع ({summary.priorityGroups.needsFollowup.length})
              </button>
            </div>

            {/* Sub-Sorting Controls */}
            <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
              <Sliders className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="text-xs font-bold text-slate-600">ترتيب العرض:</span>
              <select
                value={prioritySortMode}
                onChange={(e) => setPrioritySortMode(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="closure_first">أولوية للإغلاق والحسم أولاً 🟢</option>
                <option value="intervention_first">أولوية للتدخل العاجل أولاً 🔴</option>
                <option value="completion_desc">نسبة الإنجاز الأعلى أولاً 📈</option>
                <option value="cement_credit_desc">أكبر رصيد أسمنت لدى الوحدة 🧱</option>
              </select>
            </div>
          </div>

          {/* Group 1: Ready for Completion (أولوية للإغلاق) */}
          {(priorityFilter === 'all' || priorityFilter === 'ready_for_completion') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-r-4 border-emerald-600 pr-3">
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <span>١. مبادرات أولوية للإغلاق والحسم الميداني 🟢</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    ({summary.priorityGroups.readyForCompletion.length} مبادرة)
                  </span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...summary.priorityGroups.readyForCompletion]
                  .sort((a, b) => {
                    if (prioritySortMode === 'cement_credit_desc') return b.resourceEfficiency.cementUnitCreditBalance - a.resourceEfficiency.cementUnitCreditBalance;
                    return parseNum(b.initiative.completionRate) - parseNum(a.initiative.completionRate);
                  })
                  .map((item) => (
                  <div
                    key={item.initiative.id}
                    className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold">{item.initiative.district} - {item.initiative.subDistrict}</span>
                        <h4 className="font-black text-slate-900 text-sm">{item.initiative.name}</h4>
                      </div>
                      <span className="bg-emerald-100 text-emerald-900 text-xs font-black px-2.5 py-1 rounded-xl font-mono">
                        {item.initiative.completionRate}% إنجاز
                      </span>
                    </div>

                    <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100 space-y-1.5 text-xs">
                      <p className="text-slate-700 font-medium">
                        <strong className="text-emerald-900">سبب أولوية الإغلاق: </strong>
                        {item.priorityClassification.reason}
                      </p>
                      <div className="flex justify-between text-[11px] font-bold text-slate-600 pt-1 border-t border-emerald-100/80">
                        <span>الأسمنت المتبقي بالموقع: <strong className="text-emerald-800 font-mono">{item.resourceEfficiency.cementRemaining} كيس</strong></span>
                        <span>رصيد غير منصرف: <strong className="text-amber-800 font-mono">{item.resourceEfficiency.cementUnitCreditBalance} كيس</strong></span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="text-slate-600 font-bold text-[11px] line-clamp-1">💡 {item.recommendation}</span>
                      {onSelectInitiative && (
                        <button
                          onClick={() => onSelectInitiative(item.initiative)}
                          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer shadow-xs transition-colors"
                        >
                          توجيه بالحسم والإغلاق ←
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Group 2: Needs Executive Decision / Intervention (أولوية للتدخل العاجل) */}
          {(priorityFilter === 'all' || priorityFilter === 'needs_decision') && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between border-r-4 border-rose-600 pr-3">
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <span>٢. مبادرات أولوية للتدخل القيادي العاجل والحد من الهدر 🔴</span>
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                    ({summary.priorityGroups.needsDecision.length} مبادرة)
                  </span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...summary.priorityGroups.needsDecision]
                  .sort((a, b) => {
                    if (prioritySortMode === 'cement_credit_desc') return b.resourceEfficiency.cementUnitCreditBalance - a.resourceEfficiency.cementUnitCreditBalance;
                    return parseNum(a.initiative.completionRate) - parseNum(b.initiative.completionRate);
                  })
                  .map((item) => (
                  <div
                    key={item.initiative.id}
                    className="bg-white border border-rose-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold">{item.initiative.district} - {item.initiative.subDistrict}</span>
                        <h4 className="font-black text-slate-900 text-sm">{item.initiative.name}</h4>
                      </div>
                      <span className="bg-rose-100 text-rose-900 text-xs font-black px-2.5 py-1 rounded-xl font-mono">
                        {item.initiative.completionRate}% إنجاز
                      </span>
                    </div>

                    <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-100 space-y-1.5 text-xs">
                      <p className="text-slate-700 font-medium">
                        <strong className="text-rose-900">سبب أولوية التدخل: </strong>
                        {item.priorityClassification.reason}
                      </p>
                      <div className="flex justify-between text-[11px] font-bold text-slate-600 pt-1 border-t border-rose-100/80">
                        <span>الأسمنت المنصرف للموقع: <strong className="text-rose-800 font-mono">{item.resourceEfficiency.cementDisbursed} كيس</strong></span>
                        <span>رصيد غير منصرف: <strong className="text-amber-800 font-mono">{item.resourceEfficiency.cementUnitCreditBalance} كيس</strong></span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="text-slate-600 font-bold text-[11px] line-clamp-1">🚨 {item.recommendation}</span>
                      {onSelectInitiative && (
                        <button
                          onClick={() => onSelectInitiative(item.initiative)}
                          className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer shadow-xs transition-colors"
                        >
                          توجيه بالتدخل والنزول ←
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Group 3: Needs Follow-up / Acceleration (أولوية للتسريع والمتابعة) */}
          {(priorityFilter === 'all' || priorityFilter === 'needs_followup') && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between border-r-4 border-amber-500 pr-3">
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <span>٣. مبادرات أولوية للتسريع والمتابعة الدورية 🟡</span>
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    ({summary.priorityGroups.needsFollowup.length} مبادرة)
                  </span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...summary.priorityGroups.needsFollowup]
                  .sort((a, b) => parseNum(b.initiative.completionRate) - parseNum(a.initiative.completionRate))
                  .map((item) => (
                  <div
                    key={item.initiative.id}
                    className="bg-white border border-amber-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold">{item.initiative.district} - {item.initiative.subDistrict}</span>
                        <h4 className="font-black text-slate-900 text-sm">{item.initiative.name}</h4>
                      </div>
                      <span className="bg-amber-100 text-amber-900 text-xs font-black px-2.5 py-1 rounded-xl font-mono">
                        {item.initiative.completionRate}% إنجاز
                      </span>
                    </div>

                    <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-100 space-y-1.5 text-xs">
                      <p className="text-slate-700 font-medium">
                        <strong className="text-amber-900">مسار المتابعة: </strong>
                        {item.priorityClassification.reason}
                      </p>
                      <div className="flex justify-between text-[11px] font-bold text-slate-600 pt-1 border-t border-amber-100/80">
                        <span>الأسمنت المنصرف: <strong className="text-slate-800 font-mono">{item.resourceEfficiency.cementDisbursed} كيس</strong></span>
                        <span>مساهمة المجتمع: <strong className="text-indigo-800 font-mono">{(item.initiative.communityContribution || 0).toLocaleString()} YER</strong></span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="text-slate-600 font-bold text-[11px] line-clamp-1">⚡ {item.recommendation}</span>
                      {onSelectInitiative && (
                        <button
                          onClick={() => onSelectInitiative(item.initiative)}
                          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer shadow-xs transition-colors"
                        >
                          تكليف مهندس متابعة ←
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ENHANCED TABLE */}
      {/* ========================================================================= */}
      {activeTab === 'enhanced_table' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden animate-fadeIn">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              الجدول التفتيشي الشامل للمبادرات بالبيانات المستوردة ({selectedDistrictLabel})
            </h3>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="تصفية في الجدول..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                تصدير CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                <tr>
                  <th className="p-3">اسم المبادرة والمديرية</th>
                  <th className="p-3">الإنجاز %</th>
                  <th className="p-3">مساهمة الوحدة YER</th>
                  <th className="p-3">المساهمة المجتمعية YER</th>
                  <th className="p-3">الأسمنت (معتمد / منصرف)</th>
                  <th className="p-3 text-amber-900 font-black">رصيد أسمنت لدى الوحدة</th>
                  <th className="p-3">مؤشر الصحة /100</th>
                  <th className="p-3">مستوى الأولوية</th>
                  <th className="p-3">توصية القرار القيادي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredAnalyses.map((a) => {
                  const init = a.initiative;
                  return (
                    <tr key={init.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold">
                        <div>{init.name}</div>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {init.district} - {init.subDistrict}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold">{init.completionRate || 0}%</td>
                      <td className="p-3 font-mono text-emerald-800 font-bold">
                        {parseNum(init.unitContribution).toLocaleString('ar-YE')}
                      </td>
                      <td className="p-3 font-mono text-indigo-800 font-bold">
                        {parseNum(init.communityContribution).toLocaleString('ar-YE')}
                      </td>
                      <td className="p-3 font-mono">
                        {a.resourceEfficiency.cementAppr} / {a.resourceEfficiency.cementDisbursed} كيس
                      </td>
                      <td className="p-3 font-mono text-amber-800 font-black bg-amber-50/60">
                        {a.resourceEfficiency.cementUnitCreditBalance} كيس
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-black border ${a.healthBadgeClass}`}>
                          {a.healthScore}/100
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${a.priorityClassification.priorityBadgeClass}`}>
                          {a.priorityClassification.levelLabel}
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-slate-600 font-medium max-w-xs">{a.recommendation}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: LEADERSHIP SUMMARY & PRINTABLE BRIEFING */}
      {/* ========================================================================= */}
      {activeTab === 'leadership_summary' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Executive Portfolio Status Box */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-800/60 pb-4">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-amber-400" />
                <h2 className="text-lg sm:text-xl font-black">ملخص القرار القيادي لنطاق: {selectedDistrictLabel}</h2>
              </div>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-400/30">
                معدل الصحة العام: {summary.healthDistribution.avgHealthScore}/100
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium text-justify">
              يبلغ إجمالي المبادرات بالنطاق الحالي <strong>{summary.totalInitiatives} مبادرة</strong>.
              المساهمة المعتمدة من وحدة التدخلات المركزية تبلغ <strong>{summary.totalUnitContribution >= 1000000 ? (summary.totalUnitContribution / 1000000).toFixed(1) + ' مليون YER' : summary.totalUnitContribution.toLocaleString('ar-YE') + ' YER'}</strong>،
              مقابل مساهمات مجتمعية تراكمية قدرها <strong>{summary.totalCommunityContribution >= 1000000 ? (summary.totalCommunityContribution / 1000000).toFixed(1) + ' مليون YER' : summary.totalCommunityContribution.toLocaleString('ar-YE') + ' YER'}</strong>.
              يبلغ رصيد الأسمنت المتبقي لدى الوحدة (لم يُصرف بعد) <strong>{summary.cement.unitCreditBalance.toLocaleString('ar-YE')} كيس</strong>، ورصيد الديزل المتبقي لدى الوحدة <strong>{summary.diesel.unitCreditBalance.toLocaleString('ar-YE')} لتر</strong>.
            </p>
          </div>

          {/* Grid: Key Achievements vs Key Gaps */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Box 1: Key Achievements */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="font-black text-emerald-800 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                أهم الإنجازات المحققة بالنطاق:
              </h3>
              <ul className="space-y-3">
                {summary.keyAchievements.map((ach, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-semibold">
                    <span className="w-5 h-5 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span>{ach}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Box 2: Key Implementation Gaps */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="font-black text-rose-800 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                أهم فجوات التنفيذ الميدانية:
              </h3>
              <ul className="space-y-3">
                {summary.keyGaps.map((gap, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-semibold">
                    <span className="w-5 h-5 bg-rose-100 text-rose-800 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      !
                    </span>
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRINTABLE EXECUTIVE REPORT MODAL */}
      {/* ========================================================================= */}
      {showExecutiveReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-auto text-right" dir="rtl">
            {/* Official Report Header & Export Action Bar */}
            <div className="border-b-2 border-emerald-800 pb-4 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase block">جمهورية اليمن - قيادة محافظة إب</span>
                  <h2 className="text-xl font-black text-slate-900">
                    وحدة التدخلات التنموية المركزية - تقرير القرار والنتائج لـ ({selectedDistrictLabel})
                  </h2>
                  <span className="text-xs text-emerald-800 font-bold block">
                    تاريخ الصدور: {new Date().toLocaleDateString('ar-YE')}م | محفظة النطاق ({summary.totalInitiatives} مبادرة)
                  </span>
                </div>

                <div className="flex items-center gap-2 print:hidden shrink-0">
                  <button
                    onClick={() => setShowExecutiveReportModal(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* QUICK EXPORT TOOLBAR INSIDE MODAL */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 text-white p-3 rounded-2xl print:hidden">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  خيارات تصدير التقرير والتقديم:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleExportWordDoc}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>تصدير Word (.docx)</span>
                  </button>

                  <button
                    onClick={handleExportPowerPoint}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                  >
                    <Presentation className="w-3.5 h-3.5" />
                    <span>تصدير PowerPoint (.pptx)</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>طباعة التقرير فوراً</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Summary Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-slate-500 block font-bold">إجمالي المبادرات:</span>
                <span className="text-base font-black text-slate-900">{summary.totalInitiatives}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-bold">مساهمة الوحدة:</span>
                <span className="text-base font-black text-emerald-700">{(summary.totalUnitContribution / 1000000).toFixed(1)}M YER</span>
              </div>
              <div>
                <span className="text-slate-500 block font-bold">المساهمة المجتمعية:</span>
                <span className="text-base font-black text-indigo-700">{(summary.totalCommunityContribution / 1000000).toFixed(1)}M YER</span>
              </div>
              <div>
                <span className="text-slate-500 block font-bold">رصيد أسمنت لدى الوحدة:</span>
                <span className="text-base font-black text-amber-800">{summary.cement.unitCreditBalance.toLocaleString('ar-YE')} كيس</span>
              </div>
            </div>

            {/* VISUAL MIND MAP (الخريطة الذهنية الشجرية للقرارات والتدخلات) */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5 rounded-2xl text-white space-y-4 print:bg-slate-50 print:text-slate-900 print:border print:border-slate-300">
              <div className="flex items-center justify-between border-b border-indigo-800/80 pb-3 print:border-slate-300">
                <h4 className="font-black text-sm text-emerald-400 flex items-center gap-2 print:text-emerald-800">
                  <Network className="w-5 h-5 text-emerald-400 print:text-emerald-800" />
                  الخريطة الذهنية الشجرية لهيكلة القرار والتدخلات القيادية (Executive Mind Map)
                </h4>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30 font-mono print:border-slate-400 print:text-slate-700">
                  نطاق التحليل: {selectedDistrictLabel}
                </span>
              </div>

              {/* Mind Map Tree Nodes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 text-xs">
                {/* Node 1: Technical & Progress */}
                <div className="bg-slate-800/90 border border-emerald-500/40 p-3.5 rounded-xl space-y-2 print:bg-white print:border-emerald-600">
                  <div className="font-black text-emerald-300 border-b border-slate-700 pb-1.5 flex items-center justify-between print:text-emerald-900 print:border-slate-200">
                    <span>📊 الميزان الفني والإنجاز</span>
                    <span className="font-mono text-[11px] text-emerald-400 print:text-emerald-800">{summary.avgCompletionRate}%</span>
                  </div>
                  <ul className="text-[11px] text-slate-300 space-y-1 print:text-slate-700">
                    <li>• إجمالي المبادرات: <strong className="text-white print:text-slate-900">{summary.totalInitiatives}</strong></li>
                    <li>• متوسط نسبة الإنجاز: <strong className="text-emerald-300 print:text-emerald-800">{summary.avgCompletionRate}%</strong></li>
                    <li>• حالة التنفيذ الميداني: <strong className="text-amber-300 print:text-amber-800">{summary.keyAchievements[0] || 'مستمرة'}</strong></li>
                  </ul>
                </div>

                {/* Node 2: Cement & Diesel Balance */}
                <div className="bg-slate-800/90 border border-amber-500/40 p-3.5 rounded-xl space-y-2 print:bg-white print:border-amber-600">
                  <div className="font-black text-amber-300 border-b border-slate-700 pb-1.5 flex items-center justify-between print:text-amber-900 print:border-slate-200">
                    <span>📦 ميزان الأسمنت والديزل</span>
                    <span className="font-mono text-[11px] text-amber-400 print:text-amber-800">{summary.cement.efficiencyPct}% كفاءة</span>
                  </div>
                  <ul className="text-[11px] text-slate-300 space-y-1 print:text-slate-700">
                    <li>• المنصرف للموقع: <strong className="text-white print:text-slate-900">{summary.cement.disbursed.toLocaleString('ar-YE')} كيس</strong></li>
                    <li>• رصيد لدى الوحدة: <strong className="text-amber-300 print:text-amber-800">{summary.cement.unitCreditBalance.toLocaleString('ar-YE')} كيس</strong></li>
                    <li>• وقود الديزل المعتمد: <strong className="text-sky-300 print:text-sky-800">{summary.diesel.approved.toLocaleString('ar-YE')} لتر</strong></li>
                  </ul>
                </div>

                {/* Node 3: Field Gaps & Need */}
                <div className="bg-slate-800/90 border border-rose-500/40 p-3.5 rounded-xl space-y-2 print:bg-white print:border-rose-600">
                  <div className="font-black text-rose-300 border-b border-slate-700 pb-1.5 flex items-center justify-between print:text-rose-900 print:border-slate-200">
                    <span>⚠️ الفجوات والاحتياج</span>
                    <span className="font-mono text-[11px] text-rose-400 print:text-rose-800">{summary.priorityGroups.needsDecision.length} مبادرات عاجلة</span>
                  </div>
                  <ul className="text-[11px] text-slate-300 space-y-1 print:text-slate-700">
                    <li>• تحسُم بقرار تنفيذي: <strong className="text-rose-300 print:text-rose-800">{summary.priorityGroups.needsDecision.length}</strong></li>
                    <li>• الفجوات المرصودة: <strong className="text-slate-200 print:text-slate-800">{summary.keyGaps[0] || 'متابعة التوزيع'}</strong></li>
                  </ul>
                </div>

                {/* Node 4: Executive Decisions & Directives */}
                <div className="bg-slate-800/90 border border-indigo-500/40 p-3.5 rounded-xl space-y-2 print:bg-white print:border-indigo-600">
                  <div className="font-black text-indigo-300 border-b border-slate-700 pb-1.5 flex items-center justify-between print:text-indigo-900 print:border-slate-200">
                    <span>🎯 القرارات والتوصيات</span>
                    <span className="font-mono text-[11px] text-indigo-400 print:text-indigo-800">حسم التمويل</span>
                  </div>
                  <ul className="text-[11px] text-slate-300 space-y-1 print:text-slate-700">
                    <li>• التوصية 1: <strong className="text-indigo-200 print:text-indigo-900">{summary.executiveRecommendations[0] || 'تسريع الصرف'}</strong></li>
                    <li>• التوصية 2: <strong className="text-slate-200 print:text-slate-800">{summary.executiveRecommendations[1] || 'تعزيز المتابعة'}</strong></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* VISUAL PRINTABLE CHARTS SECTION (المخططات البيانية للتقرير) */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <h4 className="font-black text-slate-900 text-xs uppercase border-r-4 border-emerald-600 pr-2 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-700" />
                المخططات البيانية لمقارنة الأعمال والكميات المعتمدة والمنصرفة:
              </h4>

              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workChartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                    <Bar dataKey="المعتمد" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="المنفذ" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Achievements & Recommendations */}
            <div className="space-y-3">
              <h4 className="font-black text-slate-900 text-xs uppercase border-r-4 border-emerald-600 pr-2">
                التوصيات القيادية وحسم القرارات:
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                {summary.executiveRecommendations.map((r, i) => (
                  <li key={i}>• {r}</li>
                ))}
              </ul>
            </div>

            {/* Top Priority Table */}
            <div className="space-y-2">
              <h4 className="font-black text-slate-900 text-xs uppercase border-r-4 border-rose-600 pr-2">
                مبادرات عاجلة تستوجب القرار التنفيذي بالنطاق ({summary.priorityGroups.needsDecision.length}):
              </h4>
              <table className="w-full text-[11px] border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-800 font-black">
                  <tr>
                    <th className="p-2 border-b">المبادرة والمديرية</th>
                    <th className="p-2 border-b">الإنجاز</th>
                    <th className="p-2 border-b">مساهمة الوحدة</th>
                    <th className="p-2 border-b">المنصرف</th>
                    <th className="p-2 border-b">رصيد لدى الوحدة</th>
                    <th className="p-2 border-b">السبب والتوصية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.priorityGroups.needsDecision.map((a) => (
                    <tr key={a.initiative.id}>
                      <td className="p-2 font-bold">{a.initiative.name} ({a.initiative.district})</td>
                      <td className="p-2 font-mono">{a.initiative.completionRate}%</td>
                      <td className="p-2 font-mono">{parseNum(a.initiative.unitContribution).toLocaleString('ar-YE')} YER</td>
                      <td className="p-2 font-mono">{a.resourceEfficiency.cementDisbursed} كيس</td>
                      <td className="p-2 font-mono text-amber-800 font-bold">{a.resourceEfficiency.cementUnitCreditBalance} كيس</td>
                      <td className="p-2 text-slate-600">{a.recommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ========================================================================= */}
            {/* NEW ADDED REPORT PAGE 1: INITIATIVES HEALTH & FIELD GAPS PORTAL */}
            {/* ========================================================================= */}
            <div className="print:break-before-page pt-6 border-t-2 border-emerald-800 space-y-4">
              <div className="bg-emerald-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="text-[10px] font-extrabold text-emerald-300 block uppercase">الصفحة الخامسة - تقرير القرار الميداني</span>
                  <h3 className="text-base font-black flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-emerald-400" />
                    بوابة صحة المبادرات وفجوات التنفيذ الميدانية (Health & Gaps Portal)
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold bg-emerald-800/80 px-3 py-1.5 rounded-xl border border-emerald-700">
                  <span>متوسط صحة المحفظة:</span>
                  <span className="text-emerald-300 text-sm">{summary.healthDistribution.avgHealthScore}/100</span>
                </div>
              </div>

              {/* Health Score Tier Metrics & Pie Chart */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-950 space-y-1">
                  <span className="text-xs font-extrabold block text-emerald-800">🟢 مبادرات ذات أداء جيد (&gt;=75)</span>
                  <div className="text-2xl font-black font-mono">{summary.healthDistribution.good} <span className="text-xs font-bold">مبادرة</span></div>
                  <p className="text-[10px] text-emerald-700 font-medium">أداء مستقر، تطابق عالي للجدول الفني والمواد</p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-950 space-y-1">
                  <span className="text-xs font-extrabold block text-amber-800">🟡 مبادرات تحتاج متابعة (50-74)</span>
                  <div className="text-2xl font-black font-mono">{summary.healthDistribution.warning} <span className="text-xs font-bold">مبادرة</span></div>
                  <p className="text-[10px] text-amber-700 font-medium">بطء نسبي أو فجوة توريد مستندات رصف</p>
                </div>

                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-950 space-y-1">
                  <span className="text-xs font-extrabold block text-rose-800">🔴 مبادرات ذات أداء حرج (&lt;50)</span>
                  <div className="text-2xl font-black font-mono">{summary.healthDistribution.critical} <span className="text-xs font-bold">مبادرة</span></div>
                  <p className="text-[10px] text-rose-700 font-medium">تستوجب نزولاً ميدانياً وحسم قرار الصرف</p>
                </div>
              </div>

              {/* Health Breakdown Table */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-xs uppercase border-r-4 border-emerald-600 pr-2">
                  جدول قياس صحة المبادرات ومؤشر الفجوة الميدانية بالنطاق:
                </h4>
                <table className="w-full text-[11px] border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-800 text-white font-black">
                    <tr>
                      <th className="p-2 border-b text-right">المبادرة والمديرية</th>
                      <th className="p-2 border-b text-center">الإنجاز</th>
                      <th className="p-2 border-b text-center">مؤشر الصحة</th>
                      <th className="p-2 border-b text-right">حالة الفجوة الميدانية</th>
                      <th className="p-2 border-b text-center">رصيد أسمنت بالمستودع</th>
                      <th className="p-2 border-b text-right">التوصية القيادية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {districtFilteredInitiatives.map((init) => {
                      const analysis = analyzeInitiative(init);
                      return (
                        <tr key={init.id} className="hover:bg-slate-50">
                          <td className="p-2 font-bold text-slate-900">{init.name} <span className="text-[10px] font-normal text-slate-500">({init.district})</span></td>
                          <td className="p-2 text-center font-mono font-bold">{init.completionRate}%</td>
                          <td className="p-2 text-center">
                            <span className={`px-2 py-0.5 rounded-md font-mono font-black text-[10px] ${analysis.healthBadgeClass}`}>
                              {analysis.healthScore}/100
                            </span>
                          </td>
                          <td className="p-2 font-bold text-slate-800">{analysis.executionGap.gapStatusLabel}</td>
                          <td className="p-2 text-center font-mono font-bold text-amber-800">{analysis.resourceEfficiency.cementUnitCreditBalance} كيس</td>
                          <td className="p-2 text-slate-700">{analysis.recommendation}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* NEW ADDED REPORT PAGE 2: RESOURCE EFFICIENCY & CREDIT BALANCE PORTAL */}
            {/* ========================================================================= */}
            <div className="print:break-before-page pt-6 border-t-2 border-amber-800 space-y-4">
              <div className="bg-amber-950 text-white p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="text-[10px] font-extrabold text-amber-300 block uppercase">الصفحة السادسة - ميزان الموارد ورصيد الوحدة</span>
                  <h3 className="text-base font-black flex items-center gap-2">
                    <Layers className="w-5 h-5 text-amber-400" />
                    بوابة كفاءة الموارد وميزان رصيد المبادرات لدى الوحدة (Resource Efficiency Portal)
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono font-bold bg-amber-900/80 px-3 py-1.5 rounded-xl border border-amber-800">
                  <span>كفاءة الأسمنت: <strong className="text-emerald-400">{summary.cement.efficiencyPct}%</strong></span>
                  <span>|</span>
                  <span>كفاءة الديزل: <strong className="text-sky-400">{summary.diesel.efficiencyPct}%</strong></span>
                </div>
              </div>

              {/* Detailed Materials Balances Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Cement Detailed Balance */}
                <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-3">
                  <h4 className="font-black text-amber-950 text-xs flex items-center justify-between border-b border-amber-200 pb-2">
                    <span className="flex items-center gap-1.5"><PackageCheck className="w-4 h-4 text-amber-700" /> ميزان الأسمنت المعتمد والمنصرف ورصيد الوحدة</span>
                    <span className="font-mono text-amber-800">{summary.cement.efficiencyPct}% كفاءة</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white p-2 rounded-xl border border-amber-100">
                      <span className="text-[10px] text-slate-500 block">الكلي المعتمد</span>
                      <span className="font-mono font-black text-slate-900">{summary.cement.approved.toLocaleString('ar-YE')}</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-amber-100">
                      <span className="text-[10px] text-slate-500 block">المنصرف للموقع</span>
                      <span className="font-mono font-black text-blue-900">{summary.cement.disbursed.toLocaleString('ar-YE')}</span>
                    </div>
                    <div className="bg-amber-100 p-2 rounded-xl border border-amber-300">
                      <span className="text-[10px] text-amber-900 font-bold block">رصيد لدى الوحدة</span>
                      <span className="font-mono font-black text-amber-950">{summary.cement.unitCreditBalance.toLocaleString('ar-YE')}</span>
                    </div>
                  </div>
                </div>

                {/* Diesel Detailed Balance */}
                <div className="bg-sky-50/60 border border-sky-200 rounded-2xl p-4 space-y-3">
                  <h4 className="font-black text-sky-950 text-xs flex items-center justify-between border-b border-sky-200 pb-2">
                    <span className="flex items-center gap-1.5"><Fuel className="w-4 h-4 text-sky-700" /> ميزان الديزل المعتمد والمنصرف ورصيد الوحدة</span>
                    <span className="font-mono text-sky-800">{summary.diesel.efficiencyPct}% كفاءة</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white p-2 rounded-xl border border-sky-100">
                      <span className="text-[10px] text-slate-500 block">الكلي المعتمد</span>
                      <span className="font-mono font-black text-slate-900">{summary.diesel.approved.toLocaleString('ar-YE')}</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-sky-100">
                      <span className="text-[10px] text-slate-500 block">المنصرف للمعدات</span>
                      <span className="font-mono font-black text-sky-900">{summary.diesel.disbursed.toLocaleString('ar-YE')}</span>
                    </div>
                    <div className="bg-sky-100 p-2 rounded-xl border border-sky-300">
                      <span className="text-[10px] text-sky-900 font-bold block">رصيد لدى الوحدة</span>
                      <span className="font-mono font-black text-sky-950">{summary.diesel.unitCreditBalance.toLocaleString('ar-YE')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Material Balance Table per Initiative */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-xs uppercase border-r-4 border-amber-600 pr-2">
                  كشف أرصيدات الأسمنت والديزل التفصيلي لمبادرات النطاق لدى الوحدة:
                </h4>
                <table className="w-full text-[11px] border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-800 text-white font-black">
                    <tr>
                      <th className="p-2 border-b text-right">المبادرة</th>
                      <th className="p-2 border-b text-center">مساهمة الوحدة YER</th>
                      <th className="p-2 border-b text-center">أسمنت معتمد</th>
                      <th className="p-2 border-b text-center">أسمنت منصرف</th>
                      <th className="p-2 border-b text-center bg-amber-900">رصيد أسمنت بانتظار الصرف</th>
                      <th className="p-2 border-b text-center">ديزل معتمد</th>
                      <th className="p-2 border-b text-center bg-sky-900">رصيد ديزل بانتظار الصرف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {districtFilteredInitiatives.map((init) => {
                      const analysis = analyzeInitiative(init);
                      return (
                        <tr key={init.id} className="hover:bg-slate-50">
                          <td className="p-2 font-bold text-slate-900">{init.name}</td>
                          <td className="p-2 text-center font-mono">{parseNum(init.unitContribution).toLocaleString('ar-YE')}</td>
                          <td className="p-2 text-center font-mono">{analysis.resourceEfficiency.cementAppr}</td>
                          <td className="p-2 text-center font-mono">{analysis.resourceEfficiency.cementDisbursed}</td>
                          <td className="p-2 text-center font-mono font-bold text-amber-900 bg-amber-50/50">{analysis.resourceEfficiency.cementUnitCreditBalance} كيس</td>
                          <td className="p-2 text-center font-mono">{analysis.resourceEfficiency.dieselAppr}</td>
                          <td className="p-2 text-center font-mono font-bold text-sky-900 bg-sky-50/50">{analysis.resourceEfficiency.dieselUnitCreditBalance} لتر</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* NEW ADDED REPORT PAGE 3: PRIORITY CLASSIFICATION & DECISION TIERS PORTAL */}
            {/* ========================================================================= */}
            <div className="print:break-before-page pt-6 border-t-2 border-indigo-800 space-y-4">
              <div className="bg-indigo-950 text-white p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="text-[10px] font-extrabold text-indigo-300 block uppercase">الصفحة السابعة - تصنيف الأولويات والقرارات القيادية</span>
                  <h3 className="text-base font-black flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-400" />
                    بوابة تصنيف الأولويات والقرارات التنفيذية (Priority Classification Portal)
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold bg-indigo-900/80 px-3 py-1.5 rounded-xl border border-indigo-800">
                  <span>إجمالي فئات التصنيف: <strong>3 مستويات تدخّل</strong></span>
                </div>
              </div>

              {/* Priority Groups Visual Cards */}
              <div className="space-y-4">
                {/* Group 1: Ready for Completion */}
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-2">
                  <h4 className="font-black text-emerald-900 text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> ١. مبادرات جاهزة للإكمال التام (أولوية قصوى للمساندة)</span>
                    <span className="font-mono bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md font-bold">{summary.priorityGroups.readyForCompletion.length} مبادرة</span>
                  </h4>
                  <table className="w-full text-[11px] border border-emerald-200 rounded-xl overflow-hidden bg-white">
                    <thead className="bg-emerald-800 text-white font-bold">
                      <tr>
                        <th className="p-2 text-right">المبادرة والمديرية</th>
                        <th className="p-2 text-center">الإنجاز</th>
                        <th className="p-2 text-right">سبب التصنيف والتوصية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-100">
                      {summary.priorityGroups.readyForCompletion.map((item) => (
                        <tr key={item.initiative.id}>
                          <td className="p-2 font-bold">{item.initiative.name} ({item.initiative.district})</td>
                          <td className="p-2 text-center font-mono font-bold text-emerald-800">{item.initiative.completionRate}%</td>
                          <td className="p-2 text-slate-700">{item.priorityClassification.reason} | <strong className="text-emerald-800">التوصية:</strong> {item.recommendation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Group 2: Needs Follow-up */}
                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2">
                  <h4 className="font-black text-amber-900 text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-amber-600" /> ٢. مبادرات تحتاج متابعة وتذليل عقبات ميدانية</span>
                    <span className="font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold">{summary.priorityGroups.needsFollowup.length} مبادرة</span>
                  </h4>
                  <table className="w-full text-[11px] border border-amber-200 rounded-xl overflow-hidden bg-white">
                    <thead className="bg-amber-800 text-white font-bold">
                      <tr>
                        <th className="p-2 text-right">المبادرة والمديرية</th>
                        <th className="p-2 text-center">الإنجاز</th>
                        <th className="p-2 text-right">سبب التصنيف والتوصية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100">
                      {summary.priorityGroups.needsFollowup.map((item) => (
                        <tr key={item.initiative.id}>
                          <td className="p-2 font-bold">{item.initiative.name} ({item.initiative.district})</td>
                          <td className="p-2 text-center font-mono font-bold text-amber-800">{item.initiative.completionRate}%</td>
                          <td className="p-2 text-slate-700">{item.priorityClassification.reason} | <strong className="text-amber-800">التوصية:</strong> {item.recommendation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Group 3: Needs Executive Decision */}
                <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 space-y-2">
                  <h4 className="font-black text-rose-950 text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><ShieldAlert className="w-4 h-4 text-rose-600" /> ٣. مبادرات حاسمة تستوجب القرار التنفيذي القيادي السريع</span>
                    <span className="font-mono bg-rose-200 text-rose-950 px-2 py-0.5 rounded-md font-bold">{summary.priorityGroups.needsDecision.length} مبادرة</span>
                  </h4>
                  <table className="w-full text-[11px] border border-rose-200 rounded-xl overflow-hidden bg-white">
                    <thead className="bg-rose-900 text-white font-bold">
                      <tr>
                        <th className="p-2 text-right">المبادرة والمديرية</th>
                        <th className="p-2 text-center">الإنجاز</th>
                        <th className="p-2 text-center">رصيد أسمنت بانتظار القرار</th>
                        <th className="p-2 text-right">السبب والقرار المطلوب للحسم</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-100">
                      {summary.priorityGroups.needsDecision.map((item) => (
                        <tr key={item.initiative.id}>
                          <td className="p-2 font-bold text-slate-900">{item.initiative.name} ({item.initiative.district})</td>
                          <td className="p-2 text-center font-mono font-bold text-rose-800">{item.initiative.completionRate}%</td>
                          <td className="p-2 text-center font-mono font-bold text-amber-900 bg-amber-50">{item.resourceEfficiency.cementUnitCreditBalance} كيس</td>
                          <td className="p-2 text-slate-700">{item.priorityClassification.reason} | <strong className="text-rose-900">القرار المطلـوب:</strong> {item.recommendation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Sign-off Footer */}
            <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
              <div>مُعد التقرير: مسؤول المتابعة والإشراف م. عيسى القادري</div>
              <div>اعتماد: قيادة محافظة إب ووحدة التدخلات المركزية</div>
            </div>

            {/* Print Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2 print:hidden">
              <button
                onClick={handleExportWordDoc}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md"
              >
                <FileText className="w-4 h-4" />
                تصدير Word (.docx)
              </button>

              <button
                onClick={handleExportPowerPoint}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Presentation className="w-4 h-4" />
                تصدير PowerPoint (.pptx)
              </button>

              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                طباعة التقرير فوراً 🖨️
              </button>
              <button
                onClick={() => setShowExecutiveReportModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Executive Decision Modal */}
      <ExecutiveDecisionModal
        isOpen={!!activeDecisionInit}
        onClose={() => setActiveDecisionInit(null)}
        initiative={activeDecisionInit}
        initialActionType={activeDecisionAction}
        onExecuteDecision={(updatedInit, msg) => {
          if (onUpdateInitiative) onUpdateInitiative(updatedInit);
          setDecisionSuccessMsg(msg);
          setTimeout(() => setDecisionSuccessMsg(null), 5000);
        }}
      />
    </div>
  );
}
