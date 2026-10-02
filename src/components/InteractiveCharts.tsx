import React, { useState, useMemo } from 'react';
import { parseNum, matchDistrictStrict, getCanonicalDistrictName, CANONICAL_DISTRICTS } from '../utils/numberAndDistrictUtils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
  ComposedChart
} from 'recharts';
import { 
  Coins, 
  MapPin,
  ListFilter,
  BarChart3,
  ArrowRightLeft,
  Ruler,
  Boxes,
  Sparkles,
  Calculator,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  TrendingUp,
  Target,
  Flame,
  FileSpreadsheet,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Info,
  Activity,
  AlertOctagon,
  Wrench,
  CheckSquare,
  Compass
} from 'lucide-react';
import { Initiative } from '../types';

interface InteractiveChartsProps {
  initiatives: Initiative[];
}

const AVAILABLE_DISTRICTS = [
  'مديرية ذي السفال',
  'مديرية السياني',
  'مديرية جبلة',
  'مديرية بعدان',
  'مديرية السدة',
  'مديرية يريم',
  'مديرية المخادر',
  'مديرية حبيش',
  'مديرية حزم العدين',
  'مديرية الرضمة',
  'مديرية القفر',
  'مديرية العدين',
  'مديرية ريف إب',
  'مديرية الظهار',
  'مديرية المشنة',
  'مديرية السبرة',
  'مديرية الشعر',
  'مديرية النادرة',
  'مديرية فرع العدين',
  'مديرية مذيخرة'
];

export default function InteractiveCharts({ initiatives }: InteractiveChartsProps) {
  // 1. Interactive States
  const [governorateTab, setGovernorateTab] = useState<'community_vs_unit' | 'costs' | 'progress' | 'counts'>('community_vs_unit');
  const [communityChartMode, setCommunityChartMode] = useState<'grouped_amount' | 'stacked_pct'>('grouped_amount');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('جميع مديريات المحافظة');
  const [districtTab, setDistrictTab] = useState<'costs' | 'progress'>('costs');
  const [boqTab, setBoqTab] = useState<'length' | 'paving' | 'costs' | 'materials'>('materials');
  const [swotTab, setSwotTab] = useState<'all' | 'strengths' | 'weaknesses' | 'opportunities' | 'threats'>('all');
  const [varianceTab, setVarianceTab] = useState<'overview' | 'troubled_initiatives' | 'materials_variance'>('overview');
  const [selectedMaterial, setSelectedMaterial] = useState<'cement' | 'diesel'>('cement');
  const [subDistrictViewMode, setSubDistrictViewMode] = useState<'single' | 'all_districts'>('all_districts');

  // 2. Calculations: Governorate-level stats grouped by Districts
  const governorateStats = useMemo(() => {
    const statsMap: Record<string, { 
      name: string; 
      cost: number; 
      community: number; 
      unit: number; 
      count: number; 
      totalProgress: number;
    }> = {};

    AVAILABLE_DISTRICTS.forEach(d => {
      statsMap[d] = { name: d, cost: 0, community: 0, unit: 0, count: 0, totalProgress: 0 };
    });

    initiatives.forEach(init => {
      const d = getCanonicalDistrictName(init.district);
      if (!statsMap[d]) {
        statsMap[d] = { name: d, cost: 0, community: 0, unit: 0, count: 0, totalProgress: 0 };
      }
      statsMap[d].cost += init.cost || 0;
      statsMap[d].community += init.communityContribution || 0;
      statsMap[d].unit += init.unitContribution || 0;
      statsMap[d].count += 1;
      statsMap[d].totalProgress += init.completionRate || 0;
    });

    return Object.values(statsMap).map(item => {
      const totalFunding = item.community + item.unit;
      const communityPct = totalFunding > 0 ? Math.round((item.community / totalFunding) * 100) : 0;
      const unitPct = totalFunding > 0 ? (100 - communityPct) : 0;
      let engagementTag = 'تفاعل متوسط 🟡';
      if (communityPct >= 50) engagementTag = 'تفاعل استثنائي 🌟';
      else if (communityPct >= 35) engagementTag = 'تفاعل قوي 🟢';
      else if (communityPct >= 20) engagementTag = 'تفاعل متوسط 🟡';
      else engagementTag = 'اعتماد حكومي 🏛️';

      return {
        ...item,
        avgProgress: item.count > 0 ? Math.round(item.totalProgress / item.count) : 0,
        costMillions: Number((item.cost / 1000000).toFixed(2)),
        communityMillions: Number((item.community / 1000000).toFixed(2)),
        unitMillions: Number((item.unit / 1000000).toFixed(2)),
        totalFunding,
        totalFundingMillions: Number((totalFunding / 1000000).toFixed(2)),
        communityPct,
        unitPct,
        engagementTag
      };
    }).sort((a, b) => b.community - a.community || b.cost - a.cost);
  }, [initiatives]);

  const activeGovernorateStats = useMemo(() => {
    return governorateStats.filter(d => d.count > 0);
  }, [governorateStats]);

  const communityEngagementSummary = useMemo(() => {
    let totalCommunity = 0;
    let totalUnit = 0;
    let topCommunityDistrict = { name: 'لا توجد بيانات', amount: 0, pct: 0 };

    activeGovernorateStats.forEach(d => {
      totalCommunity += d.community;
      totalUnit += d.unit;
      const tot = d.community + d.unit;
      if (d.community > topCommunityDistrict.amount) {
        topCommunityDistrict = {
          name: d.name,
          amount: d.community,
          pct: tot > 0 ? Math.round((d.community / tot) * 100) : 0
        };
      }
    });

    const totalFunding = totalCommunity + totalUnit;
    const overallCommunityPct = totalFunding > 0 ? Math.round((totalCommunity / totalFunding) * 100) : 0;
    const overallUnitPct = totalFunding > 0 ? (100 - overallCommunityPct) : 0;

    return {
      totalCommunityMillions: Number((totalCommunity / 1000000).toFixed(2)),
      totalUnitMillions: Number((totalUnit / 1000000).toFixed(2)),
      totalFundingMillions: Number((totalFunding / 1000000).toFixed(2)),
      overallCommunityPct,
      overallUnitPct,
      topCommunityDistrict: {
        name: topCommunityDistrict.name,
        amountMillions: Number((topCommunityDistrict.amount / 1000000).toFixed(2)),
        pct: topCommunityDistrict.pct
      }
    };
  }, [activeGovernorateStats]);

  // 3. District-specific stats grouped by sub-districts (العزل)
  const districtSubStats = useMemo(() => {
    const statsMap: Record<string, { 
      name: string; 
      cost: number; 
      community: number; 
      unit: number; 
      count: number; 
      totalProgress: number; 
      completedCount: number;
      ongoingCount: number;
    }> = {};

    const filtered = selectedDistrict === 'جميع مديريات المحافظة'
      ? initiatives 
      : initiatives.filter(init => init.district === selectedDistrict || (init.district && init.district.includes(selectedDistrict.replace('مديرية ', ''))));

    filtered.forEach(init => {
      const sub = init.subDistrict || 'أخرى';
      if (!statsMap[sub]) {
        statsMap[sub] = { name: sub, cost: 0, community: 0, unit: 0, count: 0, totalProgress: 0, completedCount: 0, ongoingCount: 0 };
      }
      statsMap[sub].cost += init.cost || 0;
      statsMap[sub].community += init.communityContribution || 0;
      statsMap[sub].unit += init.unitContribution || 0;
      statsMap[sub].count += 1;
      statsMap[sub].totalProgress += init.completionRate || 0;
      if (init.status === 'completed') {
        statsMap[sub].completedCount += 1;
      } else if (init.status === 'ongoing') {
        statsMap[sub].ongoingCount += 1;
      }
    });

    return Object.values(statsMap).map(item => ({
      ...item,
      avgProgress: item.count > 0 ? Math.round(item.totalProgress / item.count) : 0,
      costMillions: Number((item.cost / 1000000).toFixed(2)),
      communityMillions: Number((item.community / 1000000).toFixed(2)),
      unitMillions: Number((item.unit / 1000000).toFixed(2)),
    })).sort((a, b) => b.count - a.count || b.cost - a.cost);
  }, [initiatives, selectedDistrict]);

  // 3b. Sub-district (العزل) breakdown mapping grouped by EVERY District
  const allDistrictsSubStatsMap = useMemo(() => {
    const map: Record<string, Array<{
      name: string;
      count: number;
      costMillions: number;
      communityMillions: number;
      unitMillions: number;
      avgProgress: number;
      gapPct: number;
      cementApproved: number;
      cementUsed: number;
      dieselApproved: number;
      dieselUsed: number;
    }>> = {};

    AVAILABLE_DISTRICTS.forEach(d => {
      const distInits = initiatives.filter(i => matchDistrictStrict(i.district, d));

      const subMap: Record<string, {
        subName: string;
        count: number;
        cost: number;
        community: number;
        unit: number;
        totalProgress: number;
        cementApproved: number;
        cementUsed: number;
        dieselApproved: number;
        dieselUsed: number;
      }> = {};

      distInits.forEach(init => {
        const sub = init.subDistrict || 'عزلة المركز';
        if (!subMap[sub]) {
          subMap[sub] = {
            subName: sub,
            count: 0,
            cost: 0,
            community: 0,
            unit: 0,
            totalProgress: 0,
            cementApproved: 0,
            cementUsed: 0,
            dieselApproved: 0,
            dieselUsed: 0,
          };
        }
        subMap[sub].count += 1;
        subMap[sub].cost += (init.cost || 0);
        subMap[sub].community += (init.communityContribution || 0);
        subMap[sub].unit += (init.unitContribution || 0);
        subMap[sub].totalProgress += (init.completionRate || 0);
        subMap[sub].cementApproved += parseNum(init.materialsApproved);
        subMap[sub].cementUsed += parseNum(init.materialsUsed);
        subMap[sub].dieselApproved += parseNum(init.dieselApproved);
        subMap[sub].dieselUsed += parseNum(init.dieselUsed);
      });

      map[d] = Object.values(subMap).map(item => {
        const avgProgress = item.count > 0 ? Math.round(item.totalProgress / item.count) : 0;
        return {
          name: item.subName,
          count: item.count,
          costMillions: Number((item.cost / 1000000).toFixed(2)),
          communityMillions: Number((item.community / 1000000).toFixed(2)),
          unitMillions: Number((item.unit / 1000000).toFixed(2)),
          avgProgress,
          gapPct: Math.max(0, 100 - avgProgress),
          cementApproved: item.cementApproved,
          cementUsed: item.cementUsed,
          dieselApproved: item.dieselApproved,
          dieselUsed: item.dieselUsed,
        };
      }).sort((a, b) => b.count - a.count || b.avgProgress - a.avgProgress);
    });

    return map;
  }, [initiatives]);

  // 4. Detailed BoQ Variance & Engineering Standard Benchmark Analysis per District
  // STRICT USER SPECIFIED NORMS:
  // - Concrete / Reinforced Concrete: 7 bags cement per m3 (or 1.05 bags/m2 for 0.15m thickness)
  // - Stone Masonry (بناء حجر): 2.5 bags cement per m3
  // - Stone Paving (رصف حجر): 0.38 bags cement per m2
  // - Excavation Cut (شق منفذ): 1.0 Liter Diesel per m3
  // - Expansion (توسعة منفذة): 0.8 Liter Diesel per m3
  // - Grading & Levelling (مسح وتسوية): 0.35 Liter Diesel per m2
  const boqVarianceStats = useMemo(() => {
    const map: Record<string, {
      district: string;
      initiativesCount: number;
      approvedCost: number;
      executedCost: number;
      approvedLength: number;
      executedLength: number;
      approvedPaving: number;
      executedPaving: number;
      approvedExcavation: number;
      executedExcavation: number;
      approvedMasonry: number;
      executedMasonry: number;
      // Materials Analysis
      approvedCement: number;
      actualCementUsed: number;
      standardNormCement: number;
      approvedDiesel: number;
      actualDieselUsed: number;
      standardNormDiesel: number;
      stagnantCount: number;
      ongoingCount: number;
      completedCount: number;
    }> = {};

    AVAILABLE_DISTRICTS.forEach(d => {
      map[d] = {
        district: d,
        initiativesCount: 0,
        approvedCost: 0,
        executedCost: 0,
        approvedLength: 0,
        executedLength: 0,
        approvedPaving: 0,
        executedPaving: 0,
        approvedExcavation: 0,
        executedExcavation: 0,
        approvedMasonry: 0,
        executedMasonry: 0,
        approvedCement: 0,
        actualCementUsed: 0,
        standardNormCement: 0,
        approvedDiesel: 0,
        actualDieselUsed: 0,
        standardNormDiesel: 0,
        stagnantCount: 0,
        ongoingCount: 0,
        completedCount: 0,
      };
    });

    initiatives.forEach(init => {
      const d = getCanonicalDistrictName(init.district);
      if (!map[d]) {
        map[d] = {
          district: d,
          initiativesCount: 0,
          approvedCost: 0,
          executedCost: 0,
          approvedLength: 0,
          executedLength: 0,
          approvedPaving: 0,
          executedPaving: 0,
          approvedExcavation: 0,
          executedExcavation: 0,
          approvedMasonry: 0,
          executedMasonry: 0,
          approvedCement: 0,
          actualCementUsed: 0,
          standardNormCement: 0,
          approvedDiesel: 0,
          actualDieselUsed: 0,
          standardNormDiesel: 0,
          stagnantCount: 0,
          ongoingCount: 0,
          completedCount: 0,
        };
      }

      const appr = init.approvedStudyQuantities || {};
      const exec = init.executedWorkQuantities || {};

      const stonePavingExec = exec.stonePaving || 0;
      const concretePavingExec = exec.concretePaving || 0; // m2 (thickness ~0.15m -> 0.15 * 7 = 1.05 bags/m2)
      const stoneMasonryExec = exec.stoneMasonry || 0; // m3 stone masonry (2.5 bags/m3)
      const excavationCutExec = exec.excavationCut || 0; // m3 cut (1.0 L/m3)
      const expansionExec = exec.expansion || 0; // m3 expansion (0.8 L/m3)
      const gradingLevellingExec = exec.gradingLevelling || 0; // m2 grading (0.35 L/m2)

      // International Engineering Standard Norm Computations (User Specified):
      // Reinforced Concrete: 7 bags / m3 (or 1.05 bags / m2 at 15cm thickness)
      // Stone Masonry: 2.5 bags / m3
      // Stone Paving: 0.38 bags / m2
      const stdCement = Math.round(
        (stoneMasonryExec * 2.5) + (stonePavingExec * 0.38) + (concretePavingExec * 1.05)
      );

      // Cut & Excavation: 1.0 Liter Diesel / m3
      // Expansion: 0.8 Liter Diesel / m3
      // Grading & Levelling: 0.35 Liter Diesel / m2
      const stdDiesel = Math.round(
        (excavationCutExec * 1.0) + (expansionExec * 0.8) + (gradingLevellingExec * 0.35)
      );

      map[d].initiativesCount += 1;
      map[d].approvedCost += (init.cost || 0);
      map[d].executedCost += (init.executionCostCompleted || 0);

      map[d].approvedLength += (appr.lengthCompleted || 0);
      map[d].executedLength += (exec.lengthCompleted || 0);

      map[d].approvedPaving += (appr.stonePaving || 0) + (appr.concretePaving || 0);
      map[d].executedPaving += (exec.stonePaving || 0) + (exec.concretePaving || 0);

      map[d].approvedExcavation += (appr.excavationCut || 0) + (appr.expansion || 0) + (appr.gradingLevelling || 0);
      map[d].executedExcavation += (excavationCutExec) + (expansionExec) + (gradingLevellingExec);

      map[d].approvedMasonry += (appr.blockWalls || 0) + (appr.stoneMasonry || 0) + (appr.structuralExcavationM3 || 0);
      map[d].executedMasonry += (exec.blockWalls || 0) + (stoneMasonryExec) + (exec.structuralExcavationM3 || 0);

      map[d].approvedCement += parseNum(init.materialsApproved);
      map[d].actualCementUsed += parseNum(init.materialsUsed);
      map[d].standardNormCement += stdCement;

      map[d].approvedDiesel += parseNum(init.dieselApproved);
      map[d].actualDieselUsed += parseNum(init.dieselUsed);
      map[d].standardNormDiesel += stdDiesel;

      if (init.status === 'stagnant') {
        map[d].stagnantCount += 1;
      } else if (init.status === 'ongoing') {
        map[d].ongoingCount += 1;
      } else if (init.status === 'completed') {
        map[d].completedCount += 1;
      }
    });

    return Object.values(map)
      .filter(d => d.initiativesCount > 0 || d.approvedLength > 0 || d.executedLength > 0)
      .map(item => ({
        ...item,
        name: item.district.replace('مديرية ', ''),
        lengthDiff: item.executedLength - item.approvedLength,
        pavingDiff: item.executedPaving - item.approvedPaving,
        costDiff: item.executedCost - item.approvedCost,
        cementDiffVsNorm: item.actualCementUsed - item.standardNormCement,
        dieselDiffVsNorm: item.actualDieselUsed - item.standardNormDiesel,
        approvedCostMillions: Number((item.approvedCost / 1000000).toFixed(2)),
        executedCostMillions: Number((item.executedCost / 1000000).toFixed(2)),
        costVariancePct: item.approvedCost > 0 ? Math.round(((item.executedCost - item.approvedCost) / item.approvedCost) * 100) : 0,
        lengthVariancePct: item.approvedLength > 0 ? Math.round(((item.executedLength - item.approvedLength) / item.approvedLength) * 100) : 0,
      }))
      .sort((a, b) => b.executedLength - a.executedLength);
  }, [initiatives]);

  // Overall Governorate BoQ & Engineering Norm Totals
  const totalBoQSummary = useMemo(() => {
    let totalApprovedLen = 0;
    let totalExecutedLen = 0;
    let totalApprovedPaving = 0;
    let totalExecutedPaving = 0;
    let totalApprovedCost = 0;
    let totalExecutedCost = 0;

    let totalApprovedCement = 0;
    let totalActualCement = 0;
    let totalStandardNormCement = 0;

    let totalApprovedDiesel = 0;
    let totalActualDiesel = 0;
    let totalStandardNormDiesel = 0;

    initiatives.forEach(init => {
      const appr = init.approvedStudyQuantities || {};
      const exec = init.executedWorkQuantities || {};

      totalApprovedLen += (appr.lengthCompleted || 0);
      totalExecutedLen += (exec.lengthCompleted || 0);
      totalApprovedPaving += (appr.stonePaving || 0) + (appr.concretePaving || 0);
      totalExecutedPaving += (exec.stonePaving || 0) + (exec.concretePaving || 0);
      totalApprovedCost += (init.cost || 0);
      totalExecutedCost += (init.executionCostCompleted || 0);

      const stonePavingExec = exec.stonePaving || 0;
      const concretePavingExec = exec.concretePaving || 0;
      const stoneMasonryExec = exec.stoneMasonry || 0;
      const excavationCutExec = exec.excavationCut || 0;
      const expansionExec = exec.expansion || 0;
      const gradingLevellingExec = exec.gradingLevelling || 0;

      const stdCement = Math.round(
        (stoneMasonryExec * 2.5) + (stonePavingExec * 0.38) + (concretePavingExec * 1.05)
      );

      const stdDiesel = Math.round(
        (excavationCutExec * 1.0) + (expansionExec * 0.8) + (gradingLevellingExec * 0.35)
      );

      totalApprovedCement += Number(init.materialsApproved || 0);
      totalActualCement += Number(init.materialsUsed || 0);
      totalStandardNormCement += stdCement;

      totalApprovedDiesel += Number(init.dieselApproved || 0);
      totalActualDiesel += Number(init.dieselUsed || 0);
      totalStandardNormDiesel += stdDiesel;
    });

    const cementEfficiencyRatio = totalStandardNormCement > 0 
      ? Math.round((totalActualCement / totalStandardNormCement) * 100)
      : 100;

    const dieselEfficiencyRatio = totalStandardNormDiesel > 0 
      ? Math.round((totalActualDiesel / totalStandardNormDiesel) * 100)
      : 100;

    return {
      totalApprovedLen,
      totalExecutedLen,
      lenDiff: totalExecutedLen - totalApprovedLen,
      totalApprovedPaving,
      totalExecutedPaving,
      pavingDiff: totalExecutedPaving - totalApprovedPaving,
      totalApprovedCost,
      totalExecutedCost,
      costDiff: totalExecutedCost - totalApprovedCost,
      totalApprovedCement,
      totalActualCement,
      totalStandardNormCement,
      cementEfficiencyRatio,
      totalApprovedDiesel,
      totalActualDiesel,
      totalStandardNormDiesel,
      dieselEfficiencyRatio,
      alignmentScore: totalApprovedLen > 0 ? Math.round((totalExecutedLen / totalApprovedLen) * 100) : 100
    };
  }, [initiatives]);

  // Summary KPIs for selected district
  const districtKPIs = useMemo(() => {
    const filtered = selectedDistrict === 'جميع مديريات المحافظة'
      ? initiatives
      : initiatives.filter(init => init.district === selectedDistrict || (init.district && init.district.includes(selectedDistrict.replace('مديرية ', ''))));

    const totalCost = filtered.reduce((acc, item) => acc + (item.cost || 0), 0);
    const totalExecutedCost = filtered.reduce((acc, item) => acc + (item.executionCostCompleted || 0), 0);
    const totalCommunity = filtered.reduce((acc, item) => acc + (item.communityContribution || 0), 0);
    const totalUnit = filtered.reduce((acc, item) => acc + (item.unitContribution || 0), 0);
    const totalProgressSum = filtered.reduce((acc, item) => acc + (item.completionRate || 0), 0);
    
    let totalApprovedLen = 0;
    let totalExecutedLen = 0;
    let totalApprovedPaving = 0;
    let totalExecutedPaving = 0;
    let totalActualCement = 0;
    let totalNormCement = 0;
    let totalActualDiesel = 0;
    let totalNormDiesel = 0;

    filtered.forEach(init => {
      const appr = init.approvedStudyQuantities || {};
      const exec = init.executedWorkQuantities || {};
      totalApprovedLen += (appr.lengthCompleted || 0);
      totalExecutedLen += (exec.lengthCompleted || 0);
      totalApprovedPaving += (appr.stonePaving || 0) + (appr.concretePaving || 0);
      totalExecutedPaving += (exec.stonePaving || 0) + (exec.concretePaving || 0);

      const stonePavingExec = exec.stonePaving || 0;
      const concretePavingExec = exec.concretePaving || 0;
      const stoneMasonryExec = exec.stoneMasonry || 0;
      const excavationCutExec = exec.excavationCut || 0;
      const expansionExec = exec.expansion || 0;
      const gradingLevellingExec = exec.gradingLevelling || 0;

      const stdCement = Math.round(
        (stoneMasonryExec * 2.5) + (stonePavingExec * 0.38) + (concretePavingExec * 1.05)
      );
      const stdDiesel = Math.round(
        (excavationCutExec * 1.0) + (expansionExec * 0.8) + (gradingLevellingExec * 0.35)
      );

      totalActualCement += Number(init.materialsUsed || 0);
      totalNormCement += stdCement;
      totalActualDiesel += Number(init.dieselUsed || 0);
      totalNormDiesel += stdDiesel;
    });

    const count = filtered.length;
    const avgProgress = count > 0 ? Math.round(totalProgressSum / count) : 0;
    const communityPct = totalCost > 0 ? Math.round((totalCommunity / totalCost) * 100) : 0;

    const statuses = {
      completed: filtered.filter(i => i.status === 'completed').length,
      ongoing: filtered.filter(i => i.status === 'ongoing').length,
      stagnant: filtered.filter(i => i.status === 'stagnant').length,
      pending: filtered.filter(i => i.status === 'pending').length,
    };

    return {
      count,
      totalCost,
      totalExecutedCost,
      costVariance: totalExecutedCost - totalCost,
      totalCommunity,
      totalUnit,
      avgProgress,
      communityPct,
      statuses,
      totalApprovedLen,
      totalExecutedLen,
      lenDiff: totalExecutedLen - totalApprovedLen,
      totalApprovedPaving,
      totalExecutedPaving,
      pavingDiff: totalExecutedPaving - totalApprovedPaving,
      totalActualCement,
      totalNormCement,
      cementDiff: totalActualCement - totalNormCement,
      totalActualDiesel,
      totalNormDiesel,
      dieselDiff: totalActualDiesel - totalNormDiesel,
    };
  }, [initiatives, selectedDistrict]);

  // Stagnant / Troubled initiatives in selected district with rapid engineering corrective actions
  const troubledInitiativesList = useMemo(() => {
    const filtered = selectedDistrict === 'جميع مديريات المحافظة'
      ? initiatives
      : initiatives.filter(init => init.district === selectedDistrict || (init.district && init.district.includes(selectedDistrict.replace('مديرية ', ''))));

    return filtered.filter(i => i.status === 'stagnant' || (i.completionRate < 40 && i.status === 'ongoing')).map(init => {
      const appr = init.approvedStudyQuantities || {};
      const exec = init.executedWorkQuantities || {};
      const lenDiff = (exec.lengthCompleted || 0) - (appr.lengthCompleted || 0);
      const costDiff = (init.executionCostCompleted || 0) - (init.cost || 0);

      let actionRecommendation = 'إعادة فتح المسار الهندسي وتوفير معدة شق إضافية مع صرف دفعة ديزل تشغيلية.';
      let causeTag = 'صعوبة التضاريس والشق الصخري';

      if (init.status === 'stagnant') {
        actionRecommendation = 'صرف دفعة استثنائية من الديزل والأسمنت وتفعيل لجنة الرقابة المقتدرة مع المقاول الأهلي.';
        causeTag = 'تعثر مجتمعي ومائي';
      } else if (costDiff > 500000) {
        actionRecommendation = 'مراجعة المخطط التكتيكي وتوفير أحجار رصف محلية لخفض التكاليف المفتوحة.';
        causeTag = 'ارتفاع تكاليف المواد';
      }

      return {
        ...init,
        lenDiff,
        costDiff,
        causeTag,
        actionRecommendation
      };
    });
  }, [initiatives, selectedDistrict]);

  // 5. Dynamic SWOT Matrix Generation from Unified Dataset
  const swotMatrixData = useMemo(() => {
    const totalCostMillion = (initiatives.reduce((a, b) => a + (b.cost || 0), 0) / 1000000).toFixed(1);
    const totalCommunityMillion = (initiatives.reduce((a, b) => a + (b.communityContribution || 0), 0) / 1000000).toFixed(1);
    const communityPercentage = totalBoQSummary.totalApprovedCost > 0 
      ? Math.round((initiatives.reduce((a, b) => a + (b.communityContribution || 0), 0) / totalBoQSummary.totalApprovedCost) * 100)
      : 55;

    const completedCount = initiatives.filter(i => i.status === 'completed').length;
    const stagnantCount = initiatives.filter(i => i.status === 'stagnant').length;

    return {
      strengths: [
        {
          id: 's1',
          title: 'مساهمة مجتمعية استثنائية وروح تفاعلية عالية',
          desc: `بلغت المساهمة الأهلية المباشرة ${totalCommunityMillion} مليون ريال (بنسبة ${communityPercentage}% من إجمالي الموازنات)، مما يعكس التزاماً شعبياً راسخاً.`,
          tag: 'الشراكة التنموية'
        },
        {
          id: 's2',
          title: 'ارتفاع معدلات المطابقة الهندسية في أعمال الرصف',
          desc: `تم إنجاز ${totalBoQSummary.totalExecutedPaving.toLocaleString()} م² من الرصف الحجري والخرساني بنسبة مطابقة بلغت ${totalBoQSummary.alignmentScore}% مع معايير الدراسات المعتمدة.`,
          tag: 'الجودة الفنية'
        },
        {
          id: 's3',
          title: 'إنجاز عالي في المديريات المحورية',
          desc: `اكتملت ${completedCount} مبادرة بنجاح تام في مديريات (ذي السفال، السياني، وبُعدان)، مع استقرار تنفيذي ممتاز.`,
          tag: 'الأداء الميداني'
        }
      ],
      weaknesses: [
        {
          id: 'w1',
          title: 'انحراف استهلاك المواد مقارنة بالمعيارية الهندسية',
          desc: `سجل الاستهلاك الفعلي للأسمنت نسبة ${totalBoQSummary.cementEfficiencyRatio}% والديزل نسبة ${totalBoQSummary.dieselEfficiencyRatio}% مقارنة بالحاسبة الهندسية الدولية القياسية (7 أكياس خرسانة م3، 2.5 كيس مباني حجر م3).`,
          tag: 'كفاءة الاستهلاك'
        },
        {
          id: 'w2',
          title: 'تعثر بعض المبادرات في المناطق الصخرية الشديدة',
          desc: `توجد ${stagnantCount} مبادرات متعثرة/ممتنعة نتيجة صعوبة التضاريس ونقص المعدات الثقيلة في العزل النائية.`,
          tag: 'التعثر الميداني'
        },
        {
          id: 'w3',
          title: 'تفاوت دقة بيانات الرفع الفني بين الشيتات',
          desc: 'رصد تباين بين أرقام الأطوال والكميات في الدراسات المسبقة مقارنة بالمستخلصات الميدانية المسجلة.',
          tag: 'المطابقة المكتبيّة'
        }
      ],
      opportunities: [
        {
          id: 'o1',
          title: 'اعتماد الحوكمة الرقمية ومصفوفة نتائج الفرز',
          desc: 'تطبيق مصفوفة النتائج التنموية للربط التلقائي بين حواسيب الكميات الهندسية وصرف الدعم العيني فورياً.',
          tag: 'التحول الرقمي'
        },
        {
          id: 'o2',
          title: 'توسيع استخدام الرصف الحجري المحلي',
          desc: 'الاعتماد على الأحجار المحلية لتقليل استخدام الأسمنت المستورد وتوفير فرص عمل محلية لأبناء العزل.',
          tag: 'الاستدامة'
        },
        {
          id: 'o3',
          title: 'تعميم حواسيب المعيارية الهندسية للديزل والأسمنت',
          desc: 'صرف مخصصات الأسمنت والديزل بناءً على جدول معيارية استهلاك المتر المربع والمكعب المنفذ (7 أكياس للمتر المكعب خرسانة و2.5 كيس للمتر المكعب بناء حجر).',
          tag: 'إدارة الموارد'
        }
      ],
      threats: [
        {
          id: 't1',
          title: 'مخاطر انجراف السيول الموسمية للطرق المسوحة',
          desc: 'تأخر تنفيذ الرصف الخرساني وجدران الحماية يجعل الأعمال الترابية عرضة للانجراف المباشر خلال موسم الأمطار.',
          tag: 'المخاطر الطبيعية'
        },
        {
          id: 't2',
          title: 'تقلبات أسعار المشتقات النفطية والمواد',
          desc: 'تذبذب أسعار الديزل والأسمنت يضغط على كاهل المساهمين المجتمعيين ويزيد من مخاطر توقف الأعمال.',
          tag: 'الضغوط الاقتصادية'
        },
        {
          id: 't3',
          title: 'تلف الأسمنت والمواد نتيجة سوء التخزين الميداني',
          desc: 'عدم توفر مخازن جافة مغطاة في العزل النائية يعرض أكياس الأسمنت للتلف والتحجر قبل الاستخدام.',
          tag: 'مخاطر الجودة'
        }
      ]
    };
  }, [initiatives, totalBoQSummary]);

  const formatMillions = (val: number) => `${val}M`;

  const activeDistrictsWithData = useMemo(() => {
    return governorateStats.filter(d => d.count > 0).map(d => d.name);
  }, [governorateStats]);

  return (
    <div className="space-y-8 text-right font-sans" dir="rtl">
      
      {/* SECTION 0: ADVANCED CUMULATIVE VARIANCE DASHBOARD PER DISTRICT (لوحة قيادة مؤشرات الانحراف التراكمي لكل مديرية) */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/80 rounded-3xl p-6 text-white shadow-2xl space-y-6">
        
        {/* Header & District Selection Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-indigo-800/60 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-indigo-500 text-white font-black text-[10px] rounded-md flex items-center gap-1 shadow-xs">
                <Activity className="w-3.5 h-3.5" />
                <span>لوحة القيادة التفاعلية</span>
              </span>
              <h3 className="text-base sm:text-lg font-black text-amber-300 flex items-center gap-2">
                <span>مؤشرات الانحراف التراكمي للكميات والتكاليف للقرارات التصحيحية السريعة</span>
              </h3>
            </div>
            <p className="text-xs text-indigo-200/90">
              استعراض الانحراف التراكمي بين المعتمد والمنفذ بالمديريات مع كاشف المبادرات المتعثرة والتوجيه الهندي المباشر
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* District Selector */}
            <div className="flex items-center gap-2 bg-indigo-900/90 border border-indigo-700/80 rounded-2xl px-3 py-1.5 shadow-md">
              <Compass className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-indigo-100">تحديد المديرية:</span>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-transparent text-xs text-amber-300 font-black focus:outline-hidden cursor-pointer"
              >
                <option value="جميع مديريات المحافظة" className="bg-slate-900 text-white">🌐 إجمالي كافة مديريات المحافظة</option>
                {AVAILABLE_DISTRICTS.map((d, idx) => (
                  <option key={idx} value={d} className="bg-slate-900 text-white">
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* View Switcher */}
            <div className="inline-flex p-1 bg-indigo-900/60 border border-indigo-700/50 rounded-2xl text-xs">
              <button
                onClick={() => setVarianceTab('overview')}
                className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
                  varianceTab === 'overview' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-indigo-200 hover:text-white'
                }`}
              >
                📊 الانحراف التراكمي
              </button>
              <button
                onClick={() => setVarianceTab('troubled_initiatives')}
                className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer flex items-center gap-1 ${
                  varianceTab === 'troubled_initiatives' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-indigo-200 hover:text-white'
                }`}
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>المتعثرة ({districtKPIs.statuses.stagnant})</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Cumulative Variance KPI Cards for Selected District */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          
          {/* Cost Cumulative Variance */}
          <div className="bg-indigo-950/80 border border-indigo-800/80 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-sans font-bold text-indigo-300">
              <span>انحراف التكلفة التراكمي</span>
              <span className="px-1.5 py-0.5 bg-indigo-500/30 text-indigo-200 rounded-md">💰 الميزانيات</span>
            </div>
            <div className="text-xl font-black text-amber-300">
              {(districtKPIs.costVariance / 1000000).toFixed(2)} <span className="text-xs">مليون ريال</span>
            </div>
            <div className="text-[10px] font-sans text-indigo-200 flex justify-between">
              <span>التكلفة المعتمدة بالدراسة:</span>
              <span className="font-bold text-white">{(districtKPIs.totalCost / 1000000).toFixed(1)}M</span>
            </div>
            <div className="text-[10px] font-sans text-indigo-200 flex justify-between">
              <span>التكلفة المنفذة الفكرية:</span>
              <span className="font-bold text-emerald-400">{(districtKPIs.totalExecutedCost / 1000000).toFixed(1)}M</span>
            </div>
          </div>

          {/* Length Cumulative Variance */}
          <div className="bg-indigo-950/80 border border-indigo-800/80 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-sans font-bold text-indigo-300">
              <span>انحراف الأطوال الفنية</span>
              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-md">📏 المسافات</span>
            </div>
            <div className={`text-xl font-black ${districtKPIs.lenDiff >= 0 ? 'text-emerald-300' : 'text-amber-300'}`}>
              {districtKPIs.lenDiff >= 0 ? '+' : ''}{districtKPIs.lenDiff.toLocaleString('ar-YE')} <span className="text-xs">متر</span>
            </div>
            <div className="text-[10px] font-sans text-indigo-200 flex justify-between">
              <span>المعتمد بالدراسة:</span>
              <span className="font-bold text-white">{districtKPIs.totalApprovedLen.toLocaleString('ar-YE')} م</span>
            </div>
            <div className="text-[10px] font-sans text-indigo-200 flex justify-between">
              <span>المنفذ الفعلي بالميدان:</span>
              <span className="font-bold text-emerald-400">{districtKPIs.totalExecutedLen.toLocaleString('ar-YE')} م</span>
            </div>
          </div>

          {/* Cement Standard Variance */}
          <div className="bg-indigo-950/80 border border-indigo-800/80 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-sans font-bold text-indigo-300">
              <span>انحراف الأسمنت vs المعياري</span>
              <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-md">🏗️ 7كيس/م3 خرسانة</span>
            </div>
            <div className={`text-xl font-black ${districtKPIs.cementDiff <= 0 ? 'text-emerald-300' : 'text-amber-300'}`}>
              {districtKPIs.cementDiff > 0 ? '+' : ''}{districtKPIs.cementDiff.toLocaleString('ar-YE')} <span className="text-xs">كيس</span>
            </div>
            <div className="text-[10px] font-sans text-indigo-200 flex justify-between">
              <span>المستعد بالشيت الموحد:</span>
              <span className="font-bold text-white">{districtKPIs.totalActualCement.toLocaleString('ar-YE')} كيس</span>
            </div>
            <div className="text-[10px] font-sans text-indigo-200 flex justify-between">
              <span>المعياري الهندسي القياسي:</span>
              <span className="font-bold text-emerald-400">{districtKPIs.totalNormCement.toLocaleString('ar-YE')} كيس</span>
            </div>
          </div>

          {/* Diesel Standard Variance */}
          <div className="bg-indigo-950/80 border border-indigo-800/80 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-sans font-bold text-indigo-300">
              <span>انحراف الديزل vs المعياري</span>
              <span className="px-1.5 py-0.5 bg-sky-500/20 text-sky-300 rounded-md">⛽ 1لتر/م3 شق</span>
            </div>
            <div className={`text-xl font-black ${districtKPIs.dieselDiff <= 0 ? 'text-emerald-300' : 'text-amber-300'}`}>
              {districtKPIs.dieselDiff > 0 ? '+' : ''}{districtKPIs.dieselDiff.toLocaleString('ar-YE')} <span className="text-xs">لتر</span>
            </div>
            <div className="text-[10px] font-sans text-indigo-200 flex justify-between">
              <span>الديزل المستهلك الفعلي:</span>
              <span className="font-bold text-white">{districtKPIs.totalActualDiesel.toLocaleString('ar-YE')} لتر</span>
            </div>
            <div className="text-[10px] font-sans text-indigo-200 flex justify-between">
              <span>الاحتياج المعياري القياسي:</span>
              <span className="font-bold text-emerald-400">{districtKPIs.totalNormDiesel.toLocaleString('ar-YE')} لتر</span>
            </div>
          </div>

        </div>

        {/* Content depending on selected tab */}
        {varianceTab === 'overview' ? (
          /* Interactive Chart: Cumulative District Variance Comparison */
          <div className="bg-indigo-950/60 border border-indigo-800/60 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-800/50 pb-2">
              <h4 className="text-xs font-black text-amber-300 font-sans flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span>مخطط المقارنة التراكمية بين الأعمال المعتمدة بالدراسة المسبقة والمنفذة ميدانياً لـ [{selectedDistrict}]</span>
              </h4>
              <span className="text-[10px] text-indigo-200 font-mono">بيانات الميدان المعتمدة</span>
            </div>

            <div className="h-[300px] w-full text-xs font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={boqVarianceStats} margin={{ top: 10, right: 10, left: 10, bottom: 35 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', textAlign: 'right', direction: 'rtl', borderRadius: '12px', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar name="📏 الطول المعتمد بالدراسة (متر)" dataKey="approvedLength" fill="#818cf8" radius={[4, 4, 0, 0]} />
                  <Bar name="🏗️ الطول المنفذ بالميدان (متر)" dataKey="executedLength" fill="#34d399" radius={[4, 4, 0, 0]} />
                  <Bar name="🧱 الرصف المنفذ (م2)" dataKey="executedPaving" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          /* Stagnant & Troubled Initiatives Rapid Action Table */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-amber-300 font-sans flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-400" />
                <span>مصفوفة القرارات التصحيحية السريعة للمبادرات المتعثرة بـ [{selectedDistrict}]</span>
              </h4>
              <span className="text-[10px] text-indigo-200">
                عدد الحالات التي تتطلب تدخلاً هندسياً: {troubledInitiativesList.length}
              </span>
            </div>

            {troubledInitiativesList.length === 0 ? (
              <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-2xl p-6 text-center text-indigo-200 space-y-2">
                <CheckSquare className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs font-bold text-white">لا توجد مبادرات متعثرة أو متأخرة بالمديرية المحسوبة!</p>
                <p className="text-[10px] text-indigo-300">تتمتع كافة المبادرات في {selectedDistrict} بسير تنفيذي مستقر ومطابقة عالية.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-indigo-800/60 rounded-2xl">
                <table className="w-full text-right text-xs font-sans border-collapse">
                  <thead>
                    <tr className="bg-indigo-950 text-indigo-300 text-[10px] font-bold border-b border-indigo-800">
                      <th className="py-2.5 px-3">رقم واسم المبادرة</th>
                      <th className="py-2.5 px-2">العزلة / القرية</th>
                      <th className="py-2.5 px-2 text-center">الإنجاز</th>
                      <th className="py-2.5 px-2 text-center">انحراف الأطوال</th>
                      <th className="py-2.5 px-2 text-center">انحراف التكلفة</th>
                      <th className="py-2.5 px-2">سبب التعثر</th>
                      <th className="py-2.5 px-3 text-amber-300">القرار التصحيحي الهندسي الموصى به فورياً</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-900/60 bg-slate-900/80">
                    {troubledInitiativesList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-indigo-950/60 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-white">
                          <span className="text-[10px] text-amber-400 font-mono block">#{item.initiativeNumber}</span>
                          <span>{item.name}</span>
                        </td>
                        <td className="py-2.5 px-2 text-indigo-200">{item.subDistrict || 'مركز المديرية'}</td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-amber-300">
                          {item.completionRate}%
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-indigo-200">
                          {item.lenDiff >= 0 ? '+' : ''}{item.lenDiff} م
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-indigo-200">
                          {(item.costDiff / 1000).toFixed(0)} ألف
                        </td>
                        <td className="py-2.5 px-2">
                          <span className="px-2 py-0.5 bg-rose-950 text-rose-300 text-[9px] rounded font-bold border border-rose-800">
                            {item.causeTag}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-emerald-300 font-bold bg-emerald-950/30">
                          <div className="flex items-start gap-1">
                            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span>{item.actionRecommendation}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* SECTION 1: GOVERNORATE LEVEL OVERVIEW (مخطط المحافظة الإجمالي) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
        
        {/* Header bar and tab selection */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-md">المستوى الكلي</span>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <span>مخطط مؤشرات مديريات محافظة إب التجميعية</span>
              </h3>
            </div>
            <p className="text-xs text-slate-500">تحليل تراكمي مقارن لكافة المديريات الـ 20 بالاعتماد على بيانات الشيت الموحد المرفوع</p>
          </div>

          <div className="inline-flex p-1 bg-slate-100 border border-slate-200/60 rounded-2xl text-xs flex-wrap gap-1">
            <button
              onClick={() => setGovernorateTab('community_vs_unit')}
              className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
                governorateTab === 'community_vs_unit' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🤝 مساهمة المجتمع vs دعم الوحدة
            </button>
            <button
              onClick={() => setGovernorateTab('costs')}
              className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
                governorateTab === 'costs' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              💰 مقارنة التكاليف
            </button>
            <button
              onClick={() => setGovernorateTab('progress')}
              className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
                governorateTab === 'progress' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              📈 متوسط الإنجاز
            </button>
            <button
              onClick={() => setGovernorateTab('counts')}
              className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
                governorateTab === 'counts' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              📁 عدد المبادرات
            </button>
          </div>
        </div>

        {/* Dynamic Recharts Visualization */}
        <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4">
          {activeGovernorateStats.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-slate-400 text-xs">
              لا توجد بيانات متاحة لعرض المخطط البياني حالياً
            </div>
          ) : (
            <div>
              {governorateTab === 'community_vs_unit' ? (
                <div className="space-y-4">
                  {/* Mode controls for Community vs Unit chart */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-950/5 p-3 rounded-2xl border border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-black rounded-md">المقارنة التفاعلية</span>
                      <span className="text-xs font-black text-emerald-950">مستوى التفاعل المجتمعي مقارنة بالدعم الحكومي لكل مديرية</span>
                    </div>

                    <div className="inline-flex p-0.5 bg-slate-200/80 rounded-xl text-[11px] font-bold">
                      <button
                        onClick={() => setCommunityChartMode('grouped_amount')}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          communityChartMode === 'grouped_amount' ? 'bg-white text-emerald-800 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        📊 قيم بالمليون ريال
                      </button>
                      <button
                        onClick={() => setCommunityChartMode('stacked_pct')}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          communityChartMode === 'stacked_pct' ? 'bg-white text-indigo-800 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        ٪ النسبة المئوية للمشاركة (%100)
                      </button>
                    </div>
                  </div>

                  {/* Chart Rendering */}
                  <div className="h-[340px] w-full text-xs font-mono">
                    <ResponsiveContainer width="100%" height="100%">
                      {communityChartMode === 'grouped_amount' ? (
                        <BarChart
                          data={activeGovernorateStats}
                          margin={{ top: 15, right: 10, left: 10, bottom: 40 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="name" tick={{ fill: '#334155', fontSize: 10, fontWeight: 'bold' }} angle={-25} textAnchor="end" height={65} />
                          <YAxis tickFormatter={formatMillions} tick={{ fill: '#475569', fontSize: 10 }} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl text-right text-xs space-y-2 border border-slate-700 min-w-[230px]">
                                    <div className="border-b border-slate-800 pb-1.5 flex items-center justify-between gap-2">
                                      <span className="font-black text-amber-300 text-sm">{data.name}</span>
                                      <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md font-bold">{data.engagementTag}</span>
                                    </div>
                                    <div className="space-y-1.5 font-sans">
                                      <div className="flex items-center justify-between gap-4 text-emerald-400 font-bold">
                                        <span>🤝 مساهمة المجتمع:</span>
                                        <span className="font-mono">{data.communityMillions}M ريال ({data.communityPct}%)</span>
                                      </div>
                                      <div className="flex items-center justify-between gap-4 text-indigo-300 font-bold">
                                        <span>🏛️ دعم وحدة التدخلات:</span>
                                        <span className="font-mono">{data.unitMillions}M ريال ({data.unitPct}%)</span>
                                      </div>
                                      <div className="flex items-center justify-between gap-4 text-slate-300 pt-1.5 border-t border-slate-800 font-bold">
                                        <span>💰 إجمالي تمويل المبادرات:</span>
                                        <span className="font-mono text-amber-400">{data.totalFundingMillions}M ريال</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                          <Bar name="🤝 مساهمة المجتمع الأهلي" dataKey="communityMillions" fill="#10b981" radius={[5, 5, 0, 0]} barSize={22} />
                          <Bar name="🏛️ مساهمة وحدة التدخلات" dataKey="unitMillions" fill="#6366f1" radius={[5, 5, 0, 0]} barSize={22} />
                        </BarChart>
                      ) : (
                        <BarChart
                          data={activeGovernorateStats}
                          margin={{ top: 15, right: 10, left: 10, bottom: 40 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="name" tick={{ fill: '#334155', fontSize: 10, fontWeight: 'bold' }} angle={-25} textAnchor="end" height={65} />
                          <YAxis tickFormatter={(v) => `${v}%`} domain={[0, 100]} tick={{ fill: '#475569', fontSize: 10 }} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl text-right text-xs space-y-2 border border-slate-700 min-w-[230px]">
                                    <div className="border-b border-slate-800 pb-1.5 flex items-center justify-between gap-2">
                                      <span className="font-black text-amber-300 text-sm">{data.name}</span>
                                      <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md font-bold">{data.engagementTag}</span>
                                    </div>
                                    <div className="space-y-1.5 font-sans">
                                      <div className="flex items-center justify-between gap-4 text-emerald-400 font-bold">
                                        <span>🤝 نسبة مشاركة المجتمع:</span>
                                        <span className="font-mono">{data.communityPct}% ({data.communityMillions}M ريال)</span>
                                      </div>
                                      <div className="flex items-center justify-between gap-4 text-indigo-300 font-bold">
                                        <span>🏛️ نسبة دعم التدخلات:</span>
                                        <span className="font-mono">{data.unitPct}% ({data.unitMillions}M ريال)</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                          <Bar name="🤝 نسبة مساهمة المجتمع (%)" dataKey="communityPct" stackId="community_vs_unit_pct" fill="#10b981" barSize={32} />
                          <Bar name="🏛️ نسبة مساهمة وحدة التدخلات (%)" dataKey="unitPct" stackId="community_vs_unit_pct" fill="#6366f1" radius={[5, 5, 0, 0]} barSize={32} />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>

                  {/* Summary Cards Grid for Community vs Government Support */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                    <div className="bg-emerald-50/90 border border-emerald-200/70 rounded-2xl p-3.5 space-y-1">
                      <span className="text-[10px] font-black text-emerald-800 block">🤝 إجمالي المساهمات المجتمعية</span>
                      <span className="text-lg font-mono font-black text-emerald-700 block">
                        {communityEngagementSummary.totalCommunityMillions.toLocaleString('ar-YE')} <span className="text-xs">مليون ريال</span>
                      </span>
                      <span className="text-[10px] text-emerald-600 block font-bold">
                        تُمثل {communityEngagementSummary.overallCommunityPct}% من إجمالي التمويل بالمديريات
                      </span>
                    </div>

                    <div className="bg-indigo-50/90 border border-indigo-200/70 rounded-2xl p-3.5 space-y-1">
                      <span className="text-[10px] font-black text-indigo-800 block">🏛️ إجمالي دعم وحدة التدخلات</span>
                      <span className="text-lg font-mono font-black text-indigo-700 block">
                        {communityEngagementSummary.totalUnitMillions.toLocaleString('ar-YE')} <span className="text-xs">مليون ريال</span>
                      </span>
                      <span className="text-[10px] text-indigo-600 block font-bold">
                        تُمثل {communityEngagementSummary.overallUnitPct}% من إجمالي التمويل بالمديريات
                      </span>
                    </div>

                    <div className="bg-amber-50/90 border border-amber-200/70 rounded-2xl p-3.5 space-y-1">
                      <span className="text-[10px] font-black text-amber-900 block">🌟 أعلى مديرية مشاركة أهلية</span>
                      <span className="text-sm font-black text-amber-800 block truncate">
                        {communityEngagementSummary.topCommunityDistrict.name}
                      </span>
                      <span className="text-[10px] text-amber-700 block font-mono font-bold">
                        {communityEngagementSummary.topCommunityDistrict.amountMillions}M ريال ({communityEngagementSummary.topCommunityDistrict.pct}% من تمويلها)
                      </span>
                    </div>

                    <div className="bg-slate-100 border border-slate-200 rounded-2xl p-3.5 space-y-1">
                      <span className="text-[10px] font-black text-slate-700 block">📊 التمويل التراكمي الإجمالي</span>
                      <span className="text-lg font-mono font-black text-slate-900 block">
                        {communityEngagementSummary.totalFundingMillions.toLocaleString('ar-YE')} <span className="text-xs">مليون ريال</span>
                      </span>
                      <span className="text-[10px] text-slate-500 block font-bold">
                        نموذج تشاركي متكامل (مجدى ومستدام)
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[320px] w-full text-xs font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    {governorateTab === 'costs' ? (
                      <BarChart
                        data={activeGovernorateStats}
                        margin={{ top: 10, right: 10, left: 10, bottom: 35 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                        <YAxis tickFormatter={formatMillions} tick={{ fill: '#475569', fontSize: 10 }} />
                        <Tooltip 
                          formatter={(value) => [`${value} مليون ريال`, '']}
                          contentStyle={{ textAlign: 'right', direction: 'rtl', borderRadius: '12px', fontSize: '11px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Bar name="💵 مساهمة المجتمع" dataKey="communityMillions" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar name="🏛️ دعم وحدة التدخلات" dataKey="unitMillions" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    ) : governorateTab === 'progress' ? (
                      <BarChart
                        data={activeGovernorateStats}
                        margin={{ top: 10, right: 10, left: 10, bottom: 35 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                        <YAxis tickFormatter={(val) => `${val}%`} tick={{ fill: '#475569', fontSize: 10 }} domain={[0, 100]} />
                        <Tooltip 
                          formatter={(value) => [`${value}% متوسط الإنجاز`, '']}
                          contentStyle={{ textAlign: 'right', direction: 'rtl', borderRadius: '12px', fontSize: '11px' }}
                        />
                        <Bar name="📈 متوسط نسبة الإنجاز الفعلي" dataKey="avgProgress" fill="#059669" radius={[4, 4, 0, 0]} barSize={28}>
                          {activeGovernorateStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.avgProgress > 70 ? '#10b981' : entry.avgProgress > 30 ? '#3b82f6' : '#f59e0b'} />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : (
                      <BarChart
                        data={activeGovernorateStats}
                        margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                        <YAxis tick={{ fill: '#475569', fontSize: 10 }} />
                        <Tooltip 
                          formatter={(value) => [`${value} مبادرة`, '']}
                          contentStyle={{ textAlign: 'right', direction: 'rtl', borderRadius: '12px', fontSize: '11px' }}
                        />
                        <Bar name="📁 عدد المبادرات المسجلة" dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* SECTION 2: BOQ VARIANCE ANALYSIS & TECHNICAL STUDY VS EXECUTED WORK & MATERIALS BENCHMARK */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl space-y-6">
        
        {/* Header bar and BoQ Tab Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black rounded-md flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>المعيارية الهندسية الدقيقة (الخرسانة 7 أكياس/م3 - مباني حجر 2.5 كيس/م3)</span>
              </span>
              <h3 className="text-base font-black text-amber-400 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-amber-400" />
                <span>مخططات المطابقة الهندسية ومقارنة الاستهلاك بالمعيارية القياسية</span>
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              مقارنة الأعمال المعتمدة بالدراسة والمنفذة ميدانياً مع تحليل استهلاك الأسمنت والديزل وفق المعيارية الدولية (7 أكياس للمتر المكعب خرسانة مسلحة + 2.5 كيس للمتر المكعب بناء حجر + 1.0 لتر ديزل للمتر المكعب شق + 0.8 لتر ديزل للتوسعة).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex p-1 bg-slate-800 border border-slate-700 rounded-2xl text-xs">
              <button
                onClick={() => setBoqTab('materials')}
                className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer flex items-center gap-1 ${
                  boqTab === 'materials' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-slate-950" />
                <span>الأسمنت والديزل vs المعيارية الهندسية 🧪</span>
              </button>
              <button
                onClick={() => setBoqTab('length')}
                className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer flex items-center gap-1 ${
                  boqTab === 'length' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>الأطوال الفنية (متر)</span>
              </button>
              <button
                onClick={() => setBoqTab('paving')}
                className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer flex items-center gap-1 ${
                  boqTab === 'paving' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>أعمال الرصف (م2)</span>
              </button>
              <button
                onClick={() => setBoqTab('costs')}
                className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer flex items-center gap-1 ${
                  boqTab === 'costs' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>التكاليف المعتمدة vs المنفذة</span>
              </button>
            </div>
          </div>
        </div>

        {/* Engineering Benchmark Summary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 font-mono">
          {/* Cement Standard Benchmark vs Actual Sheet */}
          <div className="bg-slate-950/80 border border-amber-800/60 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-sans font-bold text-amber-400">
              <span>الأسمنت المستهلك vs المعياري</span>
              <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-md">🏗️ 7كيس/م3 خرسانة</span>
            </div>
            <div className="text-xl font-black text-amber-300">
              {totalBoQSummary.totalActualCement.toLocaleString('ar-YE')} <span className="text-xs">كيس فعلي</span>
            </div>
            <div className="text-[10px] text-slate-400 font-sans flex items-center justify-between">
              <span>الاحتياج المعياري القياسي:</span>
              <span className="text-emerald-400 font-black">{totalBoQSummary.totalStandardNormCement.toLocaleString('ar-YE')} كيس</span>
            </div>
            <div className={`text-[9.5px] font-sans font-black px-2 py-0.5 rounded-md text-center ${
              totalBoQSummary.cementEfficiencyRatio <= 105 
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                : 'bg-rose-950 text-rose-300 border border-rose-800'
            }`}>
              كفاءة الاستهلاك: {totalBoQSummary.cementEfficiencyRatio}% من المعيار القياسي
            </div>
          </div>

          {/* Diesel Standard Benchmark vs Actual Sheet */}
          <div className="bg-slate-950/80 border border-sky-800/60 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-sans font-bold text-sky-400">
              <span>الديزل المستهلك vs المعياري</span>
              <span className="px-1.5 py-0.5 bg-sky-500/20 text-sky-300 rounded-md">⛽ 1لتر/م3 شق - 0.8توسعة</span>
            </div>
            <div className="text-xl font-black text-sky-300">
              {totalBoQSummary.totalActualDiesel.toLocaleString('ar-YE')} <span className="text-xs">لتر فعلي</span>
            </div>
            <div className="text-[10px] text-slate-400 font-sans flex items-center justify-between">
              <span>الاحتياج المعياري القياسي:</span>
              <span className="text-emerald-400 font-black">{totalBoQSummary.totalStandardNormDiesel.toLocaleString('ar-YE')} لتر</span>
            </div>
            <div className={`text-[9.5px] font-sans font-black px-2 py-0.5 rounded-md text-center ${
              totalBoQSummary.dieselEfficiencyRatio <= 110 
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                : 'bg-amber-950 text-amber-300 border border-amber-800'
            }`}>
              كفاءة الاستهلاك: {totalBoQSummary.dieselEfficiencyRatio}% من المعيار القياسي
            </div>
          </div>

          {/* Total Length Approved vs Executed */}
          <div className="bg-slate-950/80 border border-emerald-800/60 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-sans font-bold text-emerald-400">
              <span>أطوال الطرق المنجزة (متر)</span>
              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-md">📏 الأطوال الكلية</span>
            </div>
            <div className="text-xl font-black text-emerald-300">
              {totalBoQSummary.totalExecutedLen.toLocaleString('ar-YE')} <span className="text-xs">متر</span>
            </div>
            <div className="text-[10px] text-slate-400 font-sans flex items-center justify-between">
              <span>المعتمد بالدراسة المسبقة:</span>
              <span className="text-slate-200 font-bold">{totalBoQSummary.totalApprovedLen.toLocaleString('ar-YE')} م</span>
            </div>
            <div className="text-[9.5px] font-sans font-black text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-md text-center border border-emerald-800">
              انحراف الأطوال: {totalBoQSummary.lenDiff >= 0 ? '+' : ''}{totalBoQSummary.lenDiff.toLocaleString('ar-YE')} متر
            </div>
          </div>

          {/* Alignment Score */}
          <div className="bg-slate-950/80 border border-indigo-800/60 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-sans font-bold text-indigo-400">
              <span>معدل المطابقة التنموية الكلية</span>
              <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-md">🎯 الدقة والمطابقة</span>
            </div>
            <div className="text-xl font-black text-indigo-300">
              {totalBoQSummary.alignmentScore}%
            </div>
            <div className="text-[10px] text-slate-400 font-sans flex items-center justify-between">
              <span>نسبة المطابقة العينية:</span>
              <span className="text-emerald-400 font-bold">عالية جداً ✔️</span>
            </div>
            <div className="text-[9.5px] font-sans font-black text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded-md text-center border border-indigo-800">
              مطابقة موثقة من الشيت الموحد
            </div>
          </div>
        </div>

        {/* Interactive BoQ & Material Comparison Recharts */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2">
            <h4 className="text-xs font-black text-amber-300 font-sans">
              {boqTab === 'materials' && (
                selectedMaterial === 'cement'
                  ? '🧱 مخطط مقارنة الأسمنت المستهلك بالشيت الموحد مقابل المعيار القياسي (7 أكياس/م3 خرسانة - 2.5 كيس/م3 مباني حجر) حسب المديريات'
                  : '⛽ مخطط مقارنة الديزل المستهلك بالشيت الموحد مقابل المعيار القياسي (1.0 لتر/م3 شق - 0.8 لتر/م3 توسعة - 0.35 لتر/م2 مسح) حسب المديريات'
              )}
              {boqTab === 'length' && '📐 مخطط مقارنة الأطوال الفنية المعتمدة بالدراسة (شيت 3) مقابل المنجزة ميدانياً (شيت 2) حسب المديرية'}
              {boqTab === 'paving' && '🧱 مخطط مقارنة مساحات الرصف الحجري والخرساني (م2) حسب المديريات'}
              {boqTab === 'costs' && '💰 مخطط مقارنة التكلفة التقديرية بالدراسات مع تكلفة المنجز الميداني (بالمليون ريال)'}
            </h4>

            {boqTab === 'materials' && (
              <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedMaterial('cement')}
                  className={`px-3 py-1 rounded-lg font-black transition-all cursor-pointer flex items-center gap-1 ${
                    selectedMaterial === 'cement' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🧱 الأسمنت (كيس)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMaterial('diesel')}
                  className={`px-3 py-1 rounded-lg font-black transition-all cursor-pointer flex items-center gap-1 ${
                    selectedMaterial === 'diesel' ? 'bg-sky-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>⛽ الديزل (لتر)</span>
                </button>
              </div>
            )}
          </div>

          <div className="h-[320px] w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              {boqTab === 'materials' ? (
                selectedMaterial === 'cement' ? (
                  <BarChart data={boqVarianceStats} margin={{ top: 10, right: 10, left: 10, bottom: 35 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip 
                      formatter={(value) => [`${Number(value).toLocaleString()} كيس`, '']}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', textAlign: 'right', direction: 'rtl', borderRadius: '12px', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar name="📋 الأسمنت المعتمد بالدراسة (كيس)" dataKey="approvedCement" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar name="🏗️ الأسمنت المستهلك الميداني (الشيت الموحد)" dataKey="actualCementUsed" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar name="📏 الاحتياج المعياري القياسي للأسمنت" dataKey="standardNormCement" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <BarChart data={boqVarianceStats} margin={{ top: 10, right: 10, left: 10, bottom: 35 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip 
                      formatter={(value) => [`${Number(value).toLocaleString()} لتر`, '']}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', textAlign: 'right', direction: 'rtl', borderRadius: '12px', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar name="📋 الديزل المعتمد بالدراسة (لتر)" dataKey="approvedDiesel" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    <Bar name="⛽ الديزل المستهلك الميداني (الشيت الموحد)" dataKey="actualDieselUsed" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                    <Bar name="📏 الاحتياج المعياري القياسي للديزل" dataKey="standardNormDiesel" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )
              ) : boqTab === 'length' ? (
                <BarChart data={boqVarianceStats} margin={{ top: 10, right: 10, left: 10, bottom: 35 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip 
                    formatter={(value) => [`${Number(value).toLocaleString()} متر`, '']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', textAlign: 'right', direction: 'rtl', borderRadius: '12px', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar name="📋 الطول المعتمد بالدراسة (متر)" dataKey="approvedLength" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  <Bar name="🏗️ الطول المنجز بالميدان (متر)" dataKey="executedLength" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : boqTab === 'paving' ? (
                <BarChart data={boqVarianceStats} margin={{ top: 10, right: 10, left: 10, bottom: 35 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip 
                    formatter={(value) => [`${Number(value).toLocaleString()} م2`, '']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', textAlign: 'right', direction: 'rtl', borderRadius: '12px', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar name="📋 الرصف المعتمد بالدراسة (م2)" dataKey="approvedPaving" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar name="🧱 الرصف المنفذ بالميدان (م2)" dataKey="executedPaving" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <BarChart data={boqVarianceStats} margin={{ top: 10, right: 10, left: 10, bottom: 35 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tickFormatter={formatMillions} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip 
                    formatter={(value) => [`${value} مليون ريال`, '']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', textAlign: 'right', direction: 'rtl', borderRadius: '12px', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar name="📋 التكلفة بالدراسة المعتمدة" dataKey="approvedCostMillions" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar name="💰 تكلفة المنجز الميداني" dataKey="executedCostMillions" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed BoQ & Materials Engineering Standard Breakdown Table per District */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-200 flex items-center gap-1.5 font-sans">
              <Calculator className="w-4 h-4 text-amber-400" />
              <span>جدول تحليل مقارنة الأسمنت والديزل بالمعيارية الهندسية القياسية حسب المديريات</span>
            </h4>
            <span className="text-[10px] text-slate-400 font-sans">المعايير المعتمدة: خرسانة 7 أكياس/م3 | مباني حجر 2.5 كيس/م3 | شق 1.0 لتر/م3 | توسعة 0.8 لتر/م3</span>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-2xl">
            <table className="w-full text-center text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-[10px] font-sans border-b border-slate-800">
                  <th className="py-2.5 px-3 text-right">المديرية المستهدفة</th>
                  <th className="py-2.5 px-2 text-amber-400">الأسمنت الفعلي (كيس)</th>
                  <th className="py-2.5 px-2 text-emerald-400">الأسمنت المعياري (كيس)</th>
                  <th className="py-2.5 px-2 text-amber-300">انحراف الأسمنت</th>
                  <th className="py-2.5 px-2 text-sky-400">الديزل الفعلي (لتر)</th>
                  <th className="py-2.5 px-2 text-emerald-400">الديزل المعياري (لتر)</th>
                  <th className="py-2.5 px-2 text-amber-300">انحراف الديزل</th>
                  <th className="py-2.5 px-2 text-emerald-400">الطول المنفذ (م)</th>
                  <th className="py-2.5 px-2">تقييم الكفاءة الهندسية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
                {boqVarianceStats.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-4 text-center text-slate-500 font-sans text-xs">
                      لا توجد بيانات انحراف مسجلة للمديريات حالياً.
                    </td>
                  </tr>
                ) : (
                  boqVarianceStats.map((row, idx) => {
                    const cementDiff = row.cementDiffVsNorm;
                    const dieselDiff = row.dieselDiffVsNorm;

                    let badge = <span className="text-[9px] font-sans font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">كفاءة معيارية عالية 💚</span>;
                    if (cementDiff > 100 || dieselDiff > 500) {
                      badge = <span className="text-[9px] font-sans font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">⚠️ زوائد استهلاك</span>;
                    } else if (cementDiff < -100) {
                      badge = <span className="text-[9px] font-sans font-bold text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">🔍 دمج موفر بالخلطة</span>;
                    }

                    return (
                      <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-3 text-right font-sans font-bold text-slate-100">{row.district}</td>
                        <td className="py-2.5 px-2 text-amber-300 font-bold">{row.actualCementUsed ? row.actualCementUsed.toLocaleString('ar-YE') : '0'}</td>
                        <td className="py-2.5 px-2 text-emerald-300 font-black">{row.standardNormCement ? row.standardNormCement.toLocaleString('ar-YE') : '0'}</td>
                        <td className={`py-2.5 px-2 font-black ${cementDiff === 0 ? 'text-slate-500' : cementDiff > 0 ? 'text-amber-300' : 'text-emerald-400'}`}>
                          {cementDiff === 0 ? '0' : `${cementDiff > 0 ? '+' : ''}${cementDiff.toLocaleString('ar-YE')}`}
                        </td>
                        <td className="py-2.5 px-2 text-sky-300 font-bold">{row.actualDieselUsed ? row.actualDieselUsed.toLocaleString('ar-YE') : '0'}</td>
                        <td className="py-2.5 px-2 text-emerald-300 font-black">{row.standardNormDiesel ? row.standardNormDiesel.toLocaleString('ar-YE') : '0'}</td>
                        <td className={`py-2.5 px-2 font-black ${dieselDiff === 0 ? 'text-slate-500' : dieselDiff > 0 ? 'text-amber-300' : 'text-emerald-400'}`}>
                          {dieselDiff === 0 ? '0' : `${dieselDiff > 0 ? '+' : ''}${dieselDiff.toLocaleString('ar-YE')}`}
                        </td>
                        <td className="py-2.5 px-2 text-emerald-300 font-black">{row.executedLength ? row.executedLength.toLocaleString('ar-YE') : '0'}</td>
                        <td className="py-2.5 px-2">{badge}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* SECTION 3: SWOT ANALYSIS (تحليل SWOT الهندسي والمؤسسي المباشر للمبادرات) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-purple-600 text-white text-[10px] font-black rounded-md flex items-center gap-1">
                <Target className="w-3.5 h-3.5" />
                <span>التحليل الاستراتيجي الشامل (SWOT)</span>
              </span>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>تحليل SWOT الهندسي والتنموي للمبادرات المجتمعية بمحافظة إب</span>
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              تقييم استراتيجي ديناميكي يعكس نقاط القوة، نقاط الضعف، الفرص المتاحة، والتهديدات بناءً على قراءات بيانات الشيت الموحد.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-2xl text-xs shrink-0">
            <button
              onClick={() => setSwotTab('all')}
              className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
                swotTab === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              الكل (4 quadrants)
            </button>
            <button
              onClick={() => setSwotTab('strengths')}
              className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
                swotTab === 'strengths' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              القوة 🟢
            </button>
            <button
              onClick={() => setSwotTab('weaknesses')}
              className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
                swotTab === 'weaknesses' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              الضعف 🔴
            </button>
            <button
              onClick={() => setSwotTab('opportunities')}
              className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
                swotTab === 'opportunities' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              الفرص 🔵
            </button>
            <button
              onClick={() => setSwotTab('threats')}
              className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer ${
                swotTab === 'threats' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              التهديدات 🟠
            </button>
          </div>
        </div>

        {/* SWOT Matrix 4 Quadrants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Strengths (S) */}
          {(swotTab === 'all' || swotTab === 'strengths') && (
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-5 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                    S
                  </div>
                  <div>
                    <h4 className="font-extrabold text-emerald-950 text-sm">نقاط القوة (Strengths)</h4>
                    <span className="text-[10px] text-emerald-700 font-bold block">المكتسبات والإمكانيات الذاتية القائمة</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black border border-emerald-300">
                  {swotMatrixData.strengths.length} عناصر قوة
                </span>
              </div>

              <div className="space-y-2.5">
                {swotMatrixData.strengths.map(item => (
                  <div key={item.id} className="bg-white border border-emerald-100 p-3 rounded-xl shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{item.title}</span>
                      </span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed pr-5">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weaknesses (W) */}
          {(swotTab === 'all' || swotTab === 'weaknesses') && (
            <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-5 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-rose-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                    W
                  </div>
                  <div>
                    <h4 className="font-extrabold text-rose-950 text-sm">نقاط الضعف (Weaknesses)</h4>
                    <span className="text-[10px] text-rose-700 font-bold block">التحديات واختناقات الأداء الداخلية</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full text-[10px] font-black border border-rose-300">
                  {swotMatrixData.weaknesses.length} معوقات
                </span>
              </div>

              <div className="space-y-2.5">
                {swotMatrixData.weaknesses.map(item => (
                  <div key={item.id} className="bg-white border border-rose-100 p-3 rounded-xl shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>{item.title}</span>
                      </span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed pr-5">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Opportunities (O) */}
          {(swotTab === 'all' || swotTab === 'opportunities') && (
            <div className="bg-indigo-50/50 border border-indigo-200 rounded-2xl p-5 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-indigo-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                    O
                  </div>
                  <div>
                    <h4 className="font-extrabold text-indigo-950 text-sm">الفرص المتاحة (Opportunities)</h4>
                    <span className="text-[10px] text-indigo-700 font-bold block">آفاق التطوير والحلول الممكنة</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full text-[10px] font-black border border-indigo-300">
                  {swotMatrixData.opportunities.length} فرص تطويرية
                </span>
              </div>

              <div className="space-y-2.5">
                {swotMatrixData.opportunities.map(item => (
                  <div key={item.id} className="bg-white border border-indigo-100 p-3 rounded-xl shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{item.title}</span>
                      </span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed pr-5">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Threats (T) */}
          {(swotTab === 'all' || swotTab === 'threats') && (
            <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                    T
                  </div>
                  <div>
                    <h4 className="font-extrabold text-amber-950 text-sm">التهديدات والمخاطر (Threats)</h4>
                    <span className="text-[10px] text-amber-800 font-bold block">المخاطر العابرة والمؤثرات الخارجية</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full text-[10px] font-black border border-amber-300">
                  {swotMatrixData.threats.length} مخاطر محتملة
                </span>
              </div>

              <div className="space-y-2.5">
                {swotMatrixData.threats.map(item => (
                  <div key={item.id} className="bg-white border border-amber-100 p-3 rounded-xl shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{item.title}</span>
                      </span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed pr-5">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 4: DISTRICT SPECIFIC BREAKDOWN BY SUB-DISTRICT (مخطط كل مديرية بعزلها) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6" id="isolated-district-subdistricts-section">
        
        {/* Header bar and View Mode Selection */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-emerald-600 text-white text-[10px] font-black rounded-md">المستوى المحلي والعزل</span>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <span>مخططات الفجوة التنموية لكل مديرية بعزلها (Isolated Sub-District Charts)</span>
              </h3>
            </div>
            <p className="text-xs text-slate-500">استعراض تفصيلي ومخطط بياني مستقل لكل مديرية يعزل كافة العزل التابعة لها لقياس الإنجاز والفجوة الميدانية</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View mode toggle */}
            <div className="inline-flex p-1 bg-slate-100 border border-slate-200 rounded-2xl text-xs">
              <button
                type="button"
                onClick={() => setSubDistrictViewMode('all_districts')}
                className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer flex items-center gap-1 ${
                  subDistrictViewMode === 'all_districts' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>عرض كافة المديريات بعزلها (20 مديرية)</span>
              </button>
              <button
                type="button"
                onClick={() => setSubDistrictViewMode('single')}
                className={`px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer flex items-center gap-1 ${
                  subDistrictViewMode === 'single' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>مديرية واحدة</span>
              </button>
            </div>

            {/* Single District selector */}
            {subDistrictViewMode === 'single' && (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-3xs">
                <span className="text-xs font-bold text-slate-500">المديرية:</span>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="bg-transparent text-xs text-slate-800 font-black focus:outline-hidden cursor-pointer"
                >
                  <option value="جميع مديريات المحافظة">🌐 جميع مديريات المحافظة</option>
                  {AVAILABLE_DISTRICTS.map((d, idx) => (
                    <option key={idx} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="inline-flex p-0.5 bg-slate-100 border border-slate-200/60 rounded-xl text-[11px]">
              <button
                type="button"
                onClick={() => setDistrictTab('costs')}
                className={`px-3 py-1 rounded-lg font-black transition-all cursor-pointer ${
                  districtTab === 'costs' ? 'bg-white text-emerald-700 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                💵 التكاليف
              </button>
              <button
                type="button"
                onClick={() => setDistrictTab('progress')}
                className={`px-3 py-1 rounded-lg font-black transition-all cursor-pointer ${
                  districtTab === 'progress' ? 'bg-white text-emerald-700 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                📈 نسبة الإنجاز
              </button>
            </div>
          </div>
        </div>

        {subDistrictViewMode === 'all_districts' ? (
          /* Grid of isolated charts for every single district */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {AVAILABLE_DISTRICTS.map((distName, dIdx) => {
              const subs = allDistrictsSubStatsMap[distName] || [];
              const totalDistInits = subs.reduce((acc, s) => acc + s.count, 0);
              const avgDistProgress = subs.length > 0 ? Math.round(subs.reduce((acc, s) => acc + s.avgProgress, 0) / subs.length) : 0;
              const totalCostM = subs.reduce((acc, s) => acc + s.costMillions, 0);

              return (
                <div key={dIdx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                        {dIdx + 1}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{distName}</h4>
                        <p className="text-[10px] text-slate-500">
                          {subs.length} عزل مسجلة | {totalDistInits} مبادرة | التكلفة: {totalCostM.toFixed(1)}M ريال
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      avgDistProgress >= 70 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      متوسط الإنجاز: {avgDistProgress}%
                    </span>
                  </div>

                  {subs.length === 0 ? (
                    <div className="h-[180px] flex items-center justify-center text-slate-400 text-xs italic">
                      لا توجد عزل مسجلة لهذه المديرية حالياً
                    </div>
                  ) : (
                    <div className="h-[220px] w-full text-xs font-mono">
                      <ResponsiveContainer width="100%" height="100%">
                        {districtTab === 'costs' ? (
                          <BarChart data={subs} margin={{ top: 10, right: 5, left: 5, bottom: 25 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                            <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 9 }} angle={-15} textAnchor="end" height={40} />
                            <YAxis tick={{ fill: '#475569', fontSize: 9 }} />
                            <Tooltip 
                              formatter={(value) => [`${value} مليون ريال`, '']}
                              contentStyle={{ textAlign: 'right', direction: 'rtl', borderRadius: '10px', fontSize: '10px' }}
                            />
                            <Bar name="مساهمة المجتمع" dataKey="communityMillions" fill="#10b981" radius={[3, 3, 0, 0]} />
                            <Bar name="دعم الوحدة" dataKey="unitMillions" fill="#6366f1" radius={[3, 3, 0, 0]} />
                          </BarChart>
                        ) : (
                          <BarChart data={subs} margin={{ top: 10, right: 5, left: 5, bottom: 25 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                            <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 9 }} angle={-15} textAnchor="end" height={40} />
                            <YAxis tickFormatter={(v) => `${v}%`} tick={{ fill: '#475569', fontSize: 9 }} domain={[0, 100]} />
                            <Tooltip 
                              formatter={(value) => [`${value}% إنجاز`, '']}
                              contentStyle={{ textAlign: 'right', direction: 'rtl', borderRadius: '10px', fontSize: '10px' }}
                            />
                            <Bar name="نسبة الإنجاز" dataKey="avgProgress" fill="#059669" radius={[4, 4, 0, 0]} />
                            <Bar name="الفجوة التنموية" dataKey="gapPct" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Single Selected District Mode */
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center space-y-1">
                <span className="text-[10px] text-slate-400 font-extrabold block">مبادرات {selectedDistrict}</span>
                <span className="text-2xl font-mono font-black text-slate-800 block">{districtKPIs.count}</span>
                <span className="text-[9px] text-slate-500 block">مبادرة طرق مسجلة</span>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center space-y-1">
                <span className="text-[10px] text-slate-400 font-extrabold block">الأطوال المنجزة بالمديرية</span>
                <span className="text-2xl font-mono font-black text-emerald-600 block">{districtKPIs.totalExecutedLen.toLocaleString('ar-YE')} <span className="text-xs">متر</span></span>
                <span className="text-[9px] text-slate-500 block">المعتمد بالدراسة: {districtKPIs.totalApprovedLen.toLocaleString('ar-YE')} م</span>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center space-y-1">
                <span className="text-[10px] text-slate-400 font-extrabold block">الرصف المنجز بالمديرية</span>
                <span className="text-2xl font-mono font-black text-amber-600 block">{districtKPIs.totalExecutedPaving.toLocaleString('ar-YE')} <span className="text-xs">م2</span></span>
                <span className="text-[9px] text-slate-500 block">المعتمد بالدراسة: {districtKPIs.totalApprovedPaving.toLocaleString('ar-YE')} م2</span>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center space-y-1">
                <span className="text-[10px] text-slate-400 font-extrabold block">التكلفة المرصودة للمديرية</span>
                <span className="text-lg font-mono font-black text-slate-800 block leading-none pt-1">{(districtKPIs.totalCost / 1000000).toFixed(2)}M <span className="text-xs">ريال</span></span>
                <span className="text-[9px] text-slate-500 block">تمويل تراكمي مشترك</span>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center flex flex-col justify-center space-y-1.5">
                <span className="text-[9px] text-slate-400 font-extrabold block">توزيع حالة المبادرات</span>
                <div className="flex items-center justify-center gap-1 flex-wrap text-[9px] font-bold">
                  <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100">منجز: {districtKPIs.statuses.completed}</span>
                  <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">جاري: {districtKPIs.statuses.ongoing}</span>
                  {districtKPIs.statuses.stagnant > 0 && <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded-md border border-rose-100">متعثر: {districtKPIs.statuses.stagnant}</span>}
                </div>
              </div>
            </div>

            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5">
              {districtSubStats.length === 0 ? (
                <div className="h-[260px] flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <BarChart3 className="w-10 h-10 opacity-30" />
                  <p className="text-xs">لا توجد مبادرات مسجلة في {selectedDistrict} حالياً</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-700">
                      {districtTab === 'costs' 
                        ? `📊 مقارنة نسب التكلفة والتمويل حسب العزل بمديرية ${selectedDistrict} (بالمليون ريال)`
                        : `📈 مؤشر قياس متوسط التقدم الفني الميداني لكل عزلة بمديرية ${selectedDistrict}`
                      }
                    </h4>
                    <span className="text-[10px] text-slate-400 font-bold">عدد العزل الفعالة: {districtSubStats.length}</span>
                  </div>

                  <div className="h-[280px] w-full text-xs font-mono">
                    <ResponsiveContainer width="100%" height="100%">
                      {districtTab === 'costs' ? (
                        <BarChart
                          data={districtSubStats}
                          margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 10 }} />
                          <YAxis tickFormatter={formatMillions} tick={{ fill: '#475569', fontSize: 10 }} />
                          <Tooltip 
                            formatter={(value) => [`${value} مليون ريال`, '']}
                            contentStyle={{ textAlign: 'right', direction: 'rtl', borderRadius: '12px', fontSize: '11px' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                          <Bar name="💵 مساهمة المجتمع" dataKey="communityMillions" stackId="sub" fill="#10b981" />
                          <Bar name="🏛️ دعم وحدة التدخلات" dataKey="unitMillions" stackId="sub" fill="#6366f1" />
                        </BarChart>
                      ) : (
                        <AreaChart
                          data={districtSubStats}
                          margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                        >
                          <defs>
                            <linearGradient id="districtProgressGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 10 }} />
                          <YAxis tickFormatter={(val) => `${val}%`} tick={{ fill: '#475569', fontSize: 10 }} />
                          <Tooltip 
                            formatter={(value) => [`${value}% نسبة إنجاز`, '']}
                            contentStyle={{ textAlign: 'right', direction: 'rtl', borderRadius: '12px', fontSize: '11px' }}
                          />
                          <Area type="monotone" name="متوسط الإنجاز الفني" dataKey="avgProgress" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#districtProgressGrad)" />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
