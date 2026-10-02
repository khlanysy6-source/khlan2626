import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  MapPin, 
  TrendingUp, 
  Coins, 
  Building, 
  CheckCircle, 
  AlertTriangle, 
  Compass, 
  Search, 
  Filter, 
  RotateCcw, 
  Layers, 
  Table, 
  ArrowLeft,
  ChevronRight,
  TrendingDown,
  Info,
  Pencil
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
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { Initiative, UserRole } from '../types';

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

interface DistrictInteractivePortalProps {
  initiatives: Initiative[];
  preSelectedDistrict?: string | null;
  onSelectInitiative?: (id: string) => void;
  onClose?: () => void;
  userRole?: UserRole | 'admin' | 'visitor';
  onUpdateInitiative?: (updated: Initiative) => void;
}

// Bounding boxes for each district in Ibb Governorate
const DISTRICT_BOUNDS: Record<string, { latMin: number; latMax: number; lngMin: number; lngMax: number }> = {
  'all': { latMin: 13.65, latMax: 14.45, lngMin: 43.75, lngMax: 44.60 },
  'مديرية ذي السفال': { latMin: 13.74, latMax: 13.93, lngMin: 44.01, lngMax: 44.22 },
  'مديرية السياني': { latMin: 13.78, latMax: 13.98, lngMin: 44.15, lngMax: 44.30 },
  'مديرية جبلة': { latMin: 13.88, latMax: 14.00, lngMin: 44.05, lngMax: 44.18 },
  'مديرية بعدان': { latMin: 13.95, latMax: 14.15, lngMin: 44.18, lngMax: 44.40 },
  'مديرية السدة': { latMin: 14.05, latMax: 14.30, lngMin: 44.25, lngMax: 44.50 },
  'مديرية يريم': { latMin: 14.15, latMax: 14.40, lngMin: 44.15, lngMax: 44.45 },
  'مديرية المخادر': { latMin: 14.00, latMax: 14.18, lngMin: 44.05, lngMax: 44.25 },
  'مديرية حبيش': { latMin: 14.02, latMax: 14.22, lngMin: 43.95, lngMax: 44.15 },
  'مديرية حزم العدين': { latMin: 13.95, latMax: 14.20, lngMin: 43.75, lngMax: 44.05 },
  'مديرية الرضمة': { latMin: 14.05, latMax: 14.25, lngMin: 44.30, lngMax: 44.55 },
  'مديرية القفر': { latMin: 14.15, latMax: 14.45, lngMin: 43.85, lngMax: 44.15 },
  'مديرية العدين': { latMin: 13.80, latMax: 14.05, lngMin: 43.80, lngMax: 44.05 },
  'مديرية ريف إب': { latMin: 13.90, latMax: 14.12, lngMin: 44.05, lngMax: 44.30 },
  'مديرية الظهار': { latMin: 13.93, latMax: 14.01, lngMin: 44.12, lngMax: 44.22 },
  'مديرية المشنة': { latMin: 13.92, latMax: 14.00, lngMin: 44.15, lngMax: 44.25 },
  'مديرية السبرة': { latMin: 13.80, latMax: 14.02, lngMin: 44.25, lngMax: 44.48 },
  'مديرية الشعر': { latMin: 13.98, latMax: 14.18, lngMin: 44.30, lngMax: 44.50 },
  'مديرية النادرة': { latMin: 14.00, latMax: 14.25, lngMin: 44.35, lngMax: 44.60 },
  'مديرية فرع العدين': { latMin: 13.80, latMax: 14.10, lngMin: 43.65, lngMax: 43.90 },
  'مديرية مذيخرة': { latMin: 13.72, latMax: 13.92, lngMin: 43.90, lngMax: 44.10 }
};

const DEFAULT_DISTRICTS = [
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

export default function DistrictInteractivePortal({ 
  initiatives, 
  preSelectedDistrict = null, 
  onSelectInitiative,
  onClose,
  userRole = 'visitor',
  onUpdateInitiative
}: DistrictInteractivePortalProps) {
  
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSubDistrictFilter, setSelectedSubDistrictFilter] = useState<string>('all');
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [hoveredPortalInitId, setHoveredPortalInitId] = useState<string | null>(null);

  // States for Editing Initiative Modal (Admin only)
  const [editingInitiative, setEditingInitiative] = useState<Initiative | null>(null);
  const [activePathwayTab, setActivePathwayTab] = useState<number>(1);
  const [reportSearchQuery, setReportSearchQuery] = useState<string>('');

  // Map settings
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapLayer, setMapLayer] = useState<'satellite' | 'hybrid' | 'topo'>('topo');

  // Load pre-selected district if available
  useEffect(() => {
    if (preSelectedDistrict) {
      setSelectedDistrict(preSelectedDistrict);
      // Reset zoom and panning
      setZoom(1);
      setPanOffset({ x: 0, y: 0 });
      setSelectedMarkerId(null);
    }
  }, [preSelectedDistrict]);

  // Handle changing district selection
  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    setSelectedSubDistrictFilter('all');
    setSelectedMarkerId(null);
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Get active bounds based on selected district
  const bounds = useMemo(() => {
    return DISTRICT_BOUNDS[selectedDistrict] || DISTRICT_BOUNDS['all'];
  }, [selectedDistrict]);

  // Map coordinates mapping to SVG viewport percentage
  const getXY = (lat: number, lng: number) => {
    const latRange = bounds.latMax - bounds.latMin;
    const lngRange = bounds.lngMax - bounds.lngMin;
    
    // Y is inverted since SVG starts at top-left
    const yPercent = 100 - ((lat - bounds.latMin) / latRange) * 100;
    const xPercent = ((lng - bounds.lngMin) / lngRange) * 100;
    
    return { x: xPercent, y: yPercent };
  };

  // Generate unique subdistricts (عزل) for selected district
  const subDistricts = useMemo(() => {
    const list = new Set<string>();
    initiatives.forEach(init => {
      if (init.district === selectedDistrict && init.subDistrict) {
        list.add(init.subDistrict);
      }
    });
    return Array.from(list);
  }, [initiatives, selectedDistrict]);

  // Map coordinates and stability to initiatives
  const mappedInitiatives = useMemo(() => {
    return initiatives.map((init, index) => {
      let lat = 13.824;
      let lng = 44.112;
      let hasRealCoords = false;

      if (init.coordinates) {
        const parts = init.coordinates.split(/[\s,]+/);
        if (parts.length >= 2) {
          const parsedLat = parseFloat(parts[0]);
          const parsedLng = parseFloat(parts[1]);
          if (!isNaN(parsedLat) && !isNaN(parsedLng) && parsedLat > 12 && parsedLat < 15 && parsedLng > 42 && parsedLng < 46) {
            lat = parsedLat;
            lng = parsedLng;
            hasRealCoords = true;
          }
        }
      }

      // Fallback deterministic coordinates per district if not real or missing
      if (!hasRealCoords) {
        const hash = init.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + index;
        
        // Find base coordinates center for the district
        const distCenter = {
          'مديرية ذي السفال': { lat: 13.82, lng: 44.11 },
          'مديرية السياني': { lat: 13.86, lng: 44.21 },
          'مديرية جبلة': { lat: 13.93, lng: 44.12 },
          'مديرية بعدان': { lat: 14.01, lng: 44.28 },
          'مديرية السدة': { lat: 14.16, lng: 44.36 },
          'مديرية يريم': { lat: 14.28, lng: 44.29 },
          'مديرية المخادر': { lat: 14.09, lng: 44.15 },
          'مديرية حبيش': { lat: 14.12, lng: 44.05 },
          'مديرية حزم العدين': { lat: 14.08, lng: 43.88 },
          'مديرية الرضمة': { lat: 14.15, lng: 44.42 },
          'مديرية القفر': { lat: 14.30, lng: 44.00 },
          'مديرية العدين': { lat: 13.92, lng: 43.92 },
          'مديرية ريف إب': { lat: 14.01, lng: 44.18 },
          'مديرية الظهار': { lat: 13.97, lng: 44.17 },
          'مديرية المشنة': { lat: 13.96, lng: 44.20 },
          'مديرية السبرة': { lat: 13.91, lng: 44.36 },
          'مديرية الشعر': { lat: 14.08, lng: 44.40 },
          'مديرية النادرة': { lat: 14.12, lng: 44.48 },
          'مديرية فرع العدين': { lat: 13.95, lng: 43.78 },
          'مديرية مذيخرة': { lat: 13.82, lng: 44.00 },
        }[init.district] || { lat: 13.98, lng: 44.15 };

        // Spread them out deterministically based on hash
        const offsetLat = ((hash % 100) - 50) * 0.0019 * (selectedDistrict === 'all' ? 3 : 1);
        const offsetLng = (((hash >> 2) % 100) - 50) * 0.0019 * (selectedDistrict === 'all' ? 3 : 1);
        
        lat = distCenter.lat + offsetLat;
        lng = distCenter.lng + offsetLng;
      }

      return {
        ...init,
        lat,
        lng,
        hasRealCoords
      };
    });
  }, [initiatives, selectedDistrict]);

  // Filtered initiatives for display
  const filteredInitiatives = useMemo(() => {
    return mappedInitiatives.filter(init => {
      // District filter
      const matchDistrict = selectedDistrict === 'all' || init.district === selectedDistrict;
      // Sub-district (عزلة) filter
      const matchSubDistrict = selectedSubDistrictFilter === 'all' || init.subDistrict === selectedSubDistrictFilter;
      // Status filter
      const matchStatus = selectedStatusFilter === 'all' || init.status === selectedStatusFilter;
      // Search filter
      const matchSearch = searchTerm === '' || 
        init.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        init.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
        init.subDistrict.toLowerCase().includes(searchTerm.toLowerCase()) ||
        init.initiativeNumber.includes(searchTerm);

      return matchDistrict && matchSubDistrict && matchStatus && matchSearch;
    });
  }, [mappedInitiatives, selectedDistrict, selectedSubDistrictFilter, selectedStatusFilter, searchTerm]);

  // ----------------------------------------------------
  // CALCULATIONS: Selected District or Governorate Stats
  // ----------------------------------------------------
  
  const statsSummary = useMemo(() => {
    let totalCount = filteredInitiatives.length;
    let totalCost = 0;
    let totalComm = 0;
    let totalUnit = 0;
    let completedCount = 0;
    let ongoingCount = 0;
    let stagnantCount = 0;
    let stoppedCount = 0;
    let pendingCount = 0;
    let sumProgress = 0;

    filteredInitiatives.forEach(init => {
      totalCost += init.cost || 0;
      totalComm += init.communityContribution || 0;
      totalUnit += init.unitContribution || 0;
      sumProgress += init.completionRate || 0;

      if (init.status === 'completed') completedCount++;
      else if (init.status === 'ongoing') ongoingCount++;
      else if (init.status === 'stagnant') stagnantCount++;
      else if (init.status === 'stopped') stoppedCount++;
      else pendingCount++;
    });

    const avgProgress = totalCount > 0 ? Math.round(sumProgress / totalCount) : 0;
    const commPct = totalCost > 0 ? Math.round((totalComm / totalCost) * 100) : 0;
    const unitPct = totalCost > 0 ? Math.round((totalUnit / totalCost) * 100) : 0;

    return {
      totalCount,
      totalCost,
      totalComm,
      totalUnit,
      completedCount,
      ongoingCount,
      stagnantCount,
      stoppedCount,
      pendingCount,
      avgProgress,
      commPct,
      unitPct
    };
  }, [filteredInitiatives]);

  // ----------------------------------------------------
  // DATA FOR RECHARTS
  // ----------------------------------------------------

  // 1. If Governorate is selected: Compare all 12 districts
  const governorateChartData = useMemo(() => {
    if (selectedDistrict !== 'all') return [];

    const dataMap: Record<string, { name: string; cost: number; community: number; unit: number; count: number; totalProgress: number }> = {};
    DEFAULT_DISTRICTS.forEach(d => {
      dataMap[d] = { name: d.replace('مديرية ', ''), cost: 0, community: 0, unit: 0, count: 0, totalProgress: 0 };
    });

    initiatives.forEach(init => {
      const dName = init.district || 'أخرى';
      if (!dataMap[dName]) {
        dataMap[dName] = { name: dName.replace('مديرية ', ''), cost: 0, community: 0, unit: 0, count: 0, totalProgress: 0 };
      }
      dataMap[dName].cost += init.cost || 0;
      dataMap[dName].community += init.communityContribution || 0;
      dataMap[dName].unit += init.unitContribution || 0;
      dataMap[dName].count += 1;
      dataMap[dName].totalProgress += init.completionRate || 0;
    });

    return Object.values(dataMap).map(item => ({
      ...item,
      avgProgress: item.count > 0 ? Math.round(item.totalProgress / item.count) : 0,
      costMillions: Number((item.cost / 1000000).toFixed(2)),
      communityMillions: Number((item.community / 1000000).toFixed(2)),
      unitMillions: Number((item.unit / 1000000).toFixed(2)),
    })).sort((a, b) => b.cost - a.cost);
  }, [initiatives, selectedDistrict]);

  // 2. If a specific district is selected: Compare its sub-districts (العزل)
  const subDistrictChartData = useMemo(() => {
    if (selectedDistrict === 'all') return [];

    const dataMap: Record<string, { name: string; cost: number; community: number; unit: number; count: number; totalProgress: number }> = {};
    
    // Initialize with subdistricts found in initiatives of this district
    initiatives.forEach(init => {
      if (init.district === selectedDistrict && init.subDistrict) {
        const sub = init.subDistrict;
        if (!dataMap[sub]) {
          dataMap[sub] = { name: sub, cost: 0, community: 0, unit: 0, count: 0, totalProgress: 0 };
        }
        dataMap[sub].cost += init.cost || 0;
        dataMap[sub].community += init.communityContribution || 0;
        dataMap[sub].unit += init.unitContribution || 0;
        dataMap[sub].count += 1;
        dataMap[sub].totalProgress += init.completionRate || 0;
      }
    });

    return Object.values(dataMap).map(item => ({
      ...item,
      avgProgress: item.count > 0 ? Math.round(item.totalProgress / item.count) : 0,
      costMillions: Number((item.cost / 1000000).toFixed(2)),
      communityMillions: Number((item.community / 1000000).toFixed(2)),
      unitMillions: Number((item.unit / 1000000).toFixed(2)),
    })).sort((a, b) => b.cost - a.cost);
  }, [initiatives, selectedDistrict]);

  // 3. Status Pie Chart data
  const statusPieData = useMemo(() => {
    const total = statsSummary.totalCount || 1;
    return [
      { name: 'منجزة ✓', value: statsSummary.completedCount, pct: Math.round((statsSummary.completedCount / total) * 100), color: '#10b981' },
      { name: 'مستمرة 🚧', value: statsSummary.ongoingCount, pct: Math.round((statsSummary.ongoingCount / total) * 100), color: '#4f46e5' },
      { name: 'متعثرة ⚠️', value: statsSummary.stagnantCount, pct: Math.round((statsSummary.stagnantCount / total) * 100), color: '#ef4444' },
      { name: 'متوقفة 🛑', value: statsSummary.stoppedCount, pct: Math.round((statsSummary.stoppedCount / total) * 100), color: '#f59e0b' },
      { name: 'لم تبدأ ⏳', value: statsSummary.pendingCount, pct: Math.round((statsSummary.pendingCount / total) * 100), color: '#64748b' }
    ];
  }, [statsSummary]);

  // Interactive GPS Map dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 6));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 0.7));
  const handleResetMap = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    setSelectedMarkerId(null);
  };

  const selectedMarker = useMemo(() => {
    return filteredInitiatives.find(m => m.id === selectedMarkerId) || null;
  }, [filteredInitiatives, selectedMarkerId]);

  // Pre-calculate full statistical reports for all districts "بنفس الكيفية"
  const districtsStats = useMemo(() => {
    return DEFAULT_DISTRICTS.map(dist => {
      const distInits = initiatives.filter(i => i.district === dist);
      let totalCount = distInits.length;
      let totalCost = 0;
      let totalComm = 0;
      let totalUnit = 0;
      let completedCount = 0;
      let ongoingCount = 0;
      let stagnantCount = 0;
      let stoppedCount = 0;
      let pendingCount = 0;
      let sumProgress = 0;

      distInits.forEach(init => {
        totalCost += init.cost || 0;
        totalComm += init.communityContribution || 0;
        totalUnit += init.unitContribution || 0;
        sumProgress += init.completionRate || 0;

        if (init.status === 'completed') completedCount++;
        else if (init.status === 'ongoing') ongoingCount++;
        else if (init.status === 'stagnant') stagnantCount++;
        else if (init.status === 'stopped') stoppedCount++;
        else pendingCount++;
      });

      const avgProgress = totalCount > 0 ? Math.round(sumProgress / totalCount) : 0;
      const commPct = totalCost > 0 ? Math.round((totalComm / totalCost) * 100) : 0;
      const unitPct = totalCost > 0 ? Math.round((totalUnit / totalCost) * 100) : 0;

      return {
        districtName: dist,
        totalCount,
        totalCost,
        totalComm,
        totalUnit,
        completedCount,
        ongoingCount,
        stagnantCount,
        stoppedCount,
        pendingCount,
        avgProgress,
        commPct,
        unitPct
      };
    });
  }, [initiatives]);

  return (
    <div className="space-y-6" dir="rtl" id="district-interactive-portal">
      {/* Portal Header */}
      <div className="bg-slate-900 text-slate-100 rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 rounded-2xl shrink-0">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <span>بوابات المديريات والمخططات الجغرافية الذكية</span>
              <span className="bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                System v2.5
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {selectedDistrict === 'all' 
                ? 'استعراض خرائط وإحصائيات وجداول محافظة إب ككل (مديريات محافظة إب)' 
                : `استعراض خريطة ومؤشرات ومخططات عزل ${selectedDistrict} بشكل مستقل`}
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Dropdown list for selector - Fulfills "قائمة منسدلة عند الضغط على المديرية تظهر الخارطة" */}
          <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 py-2 border border-slate-700">
            <span className="text-xs text-slate-400 font-bold shrink-0">اختر المديرية:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="bg-transparent text-white text-xs font-bold focus:outline-hidden cursor-pointer pl-6 pr-1"
            >
              <option value="all" className="bg-slate-800 text-white">محافظة إب ككل (المحافظة منفصلة)</option>
              {DEFAULT_DISTRICTS.map((dist, idx) => (
                <option key={idx} value={dist} className="bg-slate-800 text-white">{dist}</option>
              ))}
            </select>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>العودة للرئيسية</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Dashboard Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Active Initiatives */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-3xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-500 text-[11px] font-black block">المبادرات المفعّلة</span>
            <h3 className="text-xl font-mono font-black text-slate-800">{statsSummary.totalCount} مبادرة</h3>
            <span className="text-[10px] text-slate-400 block">نشطة بالميدان وتلقى الدعم</span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
            <Compass className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Total cost */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-3xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-500 text-[11px] font-black block">إجمالي التمويل الإنشائي</span>
            <h3 className="text-xl font-mono font-black text-slate-800">
              {(statsSummary.totalCost / 1000000).toFixed(1)} مليون
            </h3>
            <span className="text-[10px] text-slate-400 block">ريال يمني كلفة تقديرية</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Community Contribution */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-3xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-500 text-[11px] font-black block">المساهمة الشعبية الذاتية</span>
            <h3 className="text-xl font-mono font-black text-emerald-700">
              {(statsSummary.totalComm / 1000000).toFixed(1)} مليون
            </h3>
            <span className="text-[10px] text-emerald-600 font-bold block">{statsSummary.commPct}% من التكلفة العامة</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Central Intervention */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-3xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-500 text-[11px] font-black block">مساهمة الوحدة المركزية</span>
            <h3 className="text-xl font-mono font-black text-indigo-700">
              {(statsSummary.totalUnit / 1000000).toFixed(1)} مليون
            </h3>
            <span className="text-[10px] text-indigo-600 font-bold block">{statsSummary.unitPct}% أسمنت ومواد</span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
            <Building className="w-5 h-5" />
          </div>
        </div>

        {/* Card 5: Avg completion */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-3xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-500 text-[11px] font-black block">متوسط الإنجاز الميداني</span>
            <h3 className="text-xl font-mono font-black text-slate-800">{statsSummary.avgProgress}%</h3>
            <div className="w-16 bg-slate-100 h-1 rounded-full overflow-hidden mt-1">
              <div className="bg-emerald-600 h-1 rounded-full" style={{ width: `${statsSummary.avgProgress}%` }}></div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID: Map and Filters / Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Right side: Map Canvas & Filters (col-span-7) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-3xs flex flex-col">
          
          {/* Map Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 block animate-pulse"></span>
              <span className="text-xs font-black text-slate-800">
                {selectedDistrict === 'all' 
                  ? 'الخريطة الطبوغرافية الرقمية لمحافظة إب' 
                  : `خريطة تفصيلية: ${selectedDistrict}`}
              </span>
            </div>

            {/* Map styling choices */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold">النمط:</span>
              <button 
                onClick={() => setMapLayer('topo')}
                className={`text-[10px] font-black px-2.5 py-1 rounded-lg border cursor-pointer ${
                  mapLayer === 'topo' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                مخطط
              </button>
              <button 
                onClick={() => setMapLayer('satellite')}
                className={`text-[10px] font-black px-2.5 py-1 rounded-lg border cursor-pointer ${
                  mapLayer === 'satellite' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                قمر صناعي
              </button>
              <button 
                onClick={handleResetMap}
                className="p-1 text-slate-400 hover:text-slate-800 cursor-pointer bg-slate-100 rounded-md"
                title="إعادة ضبط الخريطة"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Filters inside Map Container */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/20 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search within district */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث بالمبادرة، القرية، العزلة..."
                className="bg-slate-100/70 border border-slate-200 rounded-xl pr-8 pl-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 w-full"
              />
            </div>

            {/* Sub-district (عزلة) selection - only if district is selected */}
            <div>
              <select
                value={selectedSubDistrictFilter}
                onChange={(e) => setSelectedSubDistrictFilter(e.target.value)}
                disabled={selectedDistrict === 'all'}
                className="bg-slate-100/70 border border-slate-200 text-xs rounded-xl p-1.5 w-full text-slate-800 cursor-pointer focus:outline-hidden disabled:opacity-50"
              >
                <option value="all">كل العزل ({selectedDistrict === 'all' ? 'اختر مديرية أولاً' : subDistricts.length})</option>
                {subDistricts.map((sub, idx) => (
                  <option key={idx} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-slate-100/70 border border-slate-200 text-xs rounded-xl p-1.5 w-full text-slate-800 cursor-pointer focus:outline-hidden"
              >
                <option value="all">جميع حالات المبادرة</option>
                <option value="completed">منجزة ✓</option>
                <option value="ongoing">مستمرة 🚧</option>
                <option value="stagnant">متعثرة ⚠️</option>
                <option value="stopped">متوقفة مؤقتاً</option>
              </select>
            </div>
          </div>

          {/* Map viewport */}
          <div 
            ref={mapContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            className="relative h-[340px] bg-slate-950 overflow-hidden cursor-grab active:cursor-grabbing"
          >
            {/* Map Topographic Overlay / Grid lines */}
            {mapLayer !== 'satellite' && (
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:20px_20px] opacity-[0.15] pointer-events-none" />
            )}

            {/* Stylized Simulated Mountainous Map for Yemen Ibb */}
            {mapLayer === 'topo' ? (
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                {/* Simulated contour lines */}
                <path d="M50 50 C100 120, 200 80, 300 200 S400 300, 600 150" stroke="#10b981" strokeWidth="1" fill="none" />
                <path d="M10 150 C150 180, 250 220, 350 100 S500 50, 750 250" stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" fill="none" />
                <path d="M100 300 C200 320, 300 180, 450 350 S650 400, 800 200" stroke="#4f46e5" strokeWidth="1" fill="none" opacity="0.4" />
                {/* Yemen mountain tag */}
                <text x="80%" y="20%" fill="#475569" className="text-[10px] font-mono select-none font-bold">سلسلة جبال السراة الوسطى</text>
                <text x="15%" y="85%" fill="#475569" className="text-[10px] font-mono select-none font-bold">مدرجات إب الزراعية الخضراء</text>
              </svg>
            ) : (
              // Satellite Layer Simulation: Dark space background with deep green structures
              <div className="absolute inset-0 bg-radial from-slate-900 to-slate-950 pointer-events-none opacity-90">
                <div className="absolute top-10 left-20 w-32 h-32 rounded-full bg-emerald-950/20 blur-xl"></div>
                <div className="absolute bottom-16 right-12 w-48 h-48 rounded-full bg-teal-950/20 blur-2xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] text-slate-700 font-mono select-none">
                  GOOGLE EARTH ORTHOPHOTOMAP YEMEN-IBB
                </div>
              </div>
            )}

            {/* Scale map element */}
            <div 
              className="absolute inset-0 transition-transform duration-100 ease-out origin-center"
              style={{
                transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
              }}
            >
              {/* Plot initiative pins on map */}
              {filteredInitiatives.map((init) => {
                const { x, y } = getXY(init.lat, init.lng);

                // Determine pin color based on status
                const pinColor = init.status === 'completed'
                  ? 'text-emerald-500 fill-emerald-500'
                  : init.status === 'ongoing'
                  ? 'text-indigo-500 fill-indigo-500'
                  : init.status === 'stagnant'
                  ? 'text-rose-500 fill-rose-500'
                  : 'text-amber-500 fill-amber-500';

                return (
                  <button
                    key={init.id}
                    onClick={() => setSelectedMarkerId(init.id)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-10 hover:z-20 cursor-pointer group"
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    <div className="relative">
                      {/* Interactive ping effect for stagnant/ongoing projects */}
                      {(init.status === 'ongoing' || init.status === 'stagnant') && (
                        <span className={`absolute -inset-1.5 rounded-full animate-ping opacity-75 ${
                          init.status === 'stagnant' ? 'bg-rose-500' : 'bg-indigo-500'
                        }`} />
                      )}
                      
                      <MapPin className={`w-6 h-6 transition-transform group-hover:scale-125 ${pinColor}`} />
                      
                      {/* Small number label on pins */}
                      <span className="absolute left-1/2 top-[30%] -translate-x-1/2 -translate-y-1/2 text-[7px] text-white font-extrabold font-mono">
                        {init.initiativeNumber.replace(/\D/g, '') || 'x'}
                      </span>

                      {/* Tiny Quick Hover tooltip */}
                      <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-2.5 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                        <div className="bg-slate-950/95 backdrop-blur-md border border-indigo-500/50 text-white rounded-xl p-2.5 shadow-2xl whitespace-nowrap text-right space-y-1">
                          <p className="text-[10px] font-black text-white">{init.name}</p>
                          <p className="text-[8px] text-slate-300">عزلة {init.subDistrict} - قرية {init.village}</p>
                          <div className="flex gap-4 items-center justify-between text-[8px] pt-1.5 border-t border-slate-800 mt-1">
                            <span className="text-emerald-400 font-bold">نسبة الإنجاز: {init.completionRate}%</span>
                            <span className="text-amber-400 font-bold">التكلفة: {(init.cost / 1000000).toFixed(1)} مليون</span>
                          </div>
                        </div>
                        <div className="w-1.5 h-1.5 bg-slate-950 border-r border-b border-indigo-500/50 transform rotate-45 -mt-1"></div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Manual zoom panel inside viewport */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 bg-slate-900/95 border border-slate-800 p-1.5 rounded-xl z-20">
              <button 
                onClick={handleZoomIn} 
                className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-black cursor-pointer"
                title="تكبير"
              >
                ＋
              </button>
              <button 
                onClick={handleZoomOut} 
                className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-black cursor-pointer"
                title="تصغير"
              >
                －
              </button>
              <button 
                onClick={handleResetMap} 
                className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs cursor-pointer"
                title="إعادة تعيين"
              >
                ⟲
              </button>
            </div>

            {/* Compass rose */}
            <div className="absolute top-4 left-4 bg-slate-900/40 p-2 rounded-full pointer-events-none">
              <Compass className="w-8 h-8 text-slate-400" />
            </div>

            {/* Dynamic Map Marker details bottom drawer */}
            {selectedMarker && (
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 border border-indigo-500/40 rounded-2xl p-4 shadow-xl z-20 text-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-slideUp">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] bg-indigo-600 font-extrabold px-2 py-0.5 rounded-md text-white font-mono">
                      {selectedMarker.initiativeNumber}
                    </span>
                    <span className="text-xs text-slate-300 font-bold">
                      {selectedMarker.district} | عزلة {selectedMarker.subDistrict}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                      selectedMarker.status === 'completed' ? 'bg-emerald-600/30 text-emerald-400' :
                      selectedMarker.status === 'stagnant' ? 'bg-rose-600/30 text-rose-400' :
                      selectedMarker.status === 'stopped' ? 'bg-slate-600/30 text-slate-400' :
                      selectedMarker.status === 'ongoing' ? 'bg-indigo-600/30 text-indigo-400' :
                      'bg-amber-600/30 text-amber-400'
                    }`}>
                      {selectedMarker.status === 'completed' ? 'منجز ✓' :
                       selectedMarker.status === 'ongoing' ? 'قيد التنفيذ 🚧' :
                       selectedMarker.status === 'stagnant' ? 'متعثر ⚠️' :
                       selectedMarker.status === 'stopped' ? 'متوقف 🛑' : 'لم يبدأ ⏳'}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-white">{selectedMarker.name}</h4>
                  <p className="text-[10px] text-slate-400">
                    القرية: <strong className="text-slate-200">{selectedMarker.village || 'غير محدد'}</strong> | كلفة المبادرة: <strong className="text-emerald-400">{(selectedMarker.cost || 0).toLocaleString('ar-YE')} ريال</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                  {userRole === 'admin' && (
                    <button
                      onClick={() => {
                        const initToEdit = initiatives.find(i => i.id === selectedMarker.id);
                        if (initToEdit) {
                          setEditingInitiative(JSON.parse(JSON.stringify(initToEdit))); // deep copy
                          setActivePathwayTab(1);
                        }
                      }}
                      className="w-full sm:w-auto px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs shrink-0"
                      title="تعديل تفاصيل المبادرة والمهام ✏️"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>تعديل المبادرة ✏️</span>
                    </button>
                  )}

                  {onSelectInitiative && (
                    <button
                      onClick={() => onSelectInitiative(selectedMarker.id)}
                      className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span>استعراض مسارات المبادرة كاملة</span>
                      <ChevronRight className="w-3.5 h-3.5 transform rotate-180" />
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedMarkerId(null)}
                    className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs cursor-pointer"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Map bottom legend */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-center gap-4 text-[10px] font-bold text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
              مبادرة منجزة ومكتملة ✓
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 block"></span>
              مستمرة قيد العمل 🚧
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block"></span>
              مبادرة متعثرة ميدانياً ⚠️
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block"></span>
              متوقفة مؤقتاً
            </span>
          </div>
        </div>

        {/* Left side: Advanced Charts & Lists (col-span-5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Section 1: Dynamic charts container */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-3xs space-y-4">
            <div>
              <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider border-r-4 border-indigo-600 pr-2">
                {selectedDistrict === 'all' 
                  ? 'مقارنة الملاءة التمويلية والتكاليف بين مديريات محافظة إب (مليون)' 
                  : `تكاليف ومساهمات المبادرات لكل عزلة بـ ${selectedDistrict} (مليون)`}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                {selectedDistrict === 'all' 
                  ? 'رسم بياني يوضح حجم المبادرات وتكامل مساهمات المجتمع والوحدة لكل مديرية' 
                  : 'توزيع التكلفة الكلية ومساهمة المغتربين والوحدة المركزية على مستوى العزل'}
              </p>
            </div>

            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={selectedDistrict === 'all' ? governorateChartData : subDistrictChartData}
                  margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 9, fontWeight: 'bold', fill: '#475569' }} 
                  />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip 
                    contentStyle={{ direction: 'rtl', fontSize: '11px', borderRadius: '12px' }} 
                    formatter={(value) => [`${value} مليون ريال`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                  <Bar dataKey="costMillions" name="التكلفة الكلية" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="communityMillions" name="مساهمة المجتمع" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="unitMillions" name="مساهمة الدولة" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {selectedDistrict !== 'all' && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div>
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider border-r-4 border-emerald-600 pr-2">
                    توزيع عدد المبادرات على مستوى عزل {selectedDistrict}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">عدد المبادرات النشطة والمنفذة ميدانياً في كل عزلة</p>
                </div>
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={subDistrictChartData}
                      margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 9, fontWeight: 'bold', fill: '#475569' }} 
                      />
                      <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ direction: 'rtl', fontSize: '11px', borderRadius: '12px' }} 
                        formatter={(value) => [`${value} مبادرة`, '']}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                      <Bar dataKey="count" name="عدد المبادرات بالعزلة" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Progress Comparison / Status Distribution */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-3xs grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Status Breakdown Pie */}
            <div className="space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-black text-slate-800 pr-2 border-r-4 border-emerald-600">
                  توزيع مواقف المبادرات
                </h4>
                <p className="text-[9px] text-slate-400 mt-0.5">الحالة الميدانية الحالية للمشاريع المعروضة</p>
              </div>

              <div className="h-[110px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={45}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ direction: 'rtl', fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Pie legends */}
              <div className="flex flex-wrap gap-1 md:gap-1.5 justify-center">
                {statusPieData.map((item, idx) => (
                  <span key={idx} className="text-[7.5px] font-black px-1.5 py-0.5 rounded-sm flex items-center gap-1 text-slate-700" style={{ border: `1px solid ${item.color}30` }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: item.color }}></span>
                    <span>{item.name}:</span>
                    <span className="font-mono">{item.value} ({item.pct}%)</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Average completion rate or other comparison */}
            <div className="space-y-2.5 flex flex-col justify-between border-t sm:border-t-0 sm:border-r border-slate-100 pr-0 sm:pr-4">
              <div>
                <h4 className="text-xs font-black text-slate-800 pr-2 border-r-4 border-indigo-600">
                  الأثر التنموي وحالة المبادرات الخمسة
                </h4>
                <p className="text-[9px] text-slate-400 mt-0.5">الفرز الإحصائي ومطابقة نسب الإنجاز التراكمية</p>
              </div>

              <div className="space-y-2 pt-1">
                {statusPieData.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-slate-600 font-extrabold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                        {item.name}
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {item.value} مبادرة ({item.pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-1.5 rounded-full transition-all duration-500" 
                        style={{ backgroundColor: item.color, width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-[8.5px] text-slate-500 leading-relaxed font-semibold">
                💡 الرشادة التنفيذية: معالجة التعثرات والمبادرات المتوقفة تتم عبر تفعيل اللجان والمناقلة ومسارات المتابعة الميدانية.
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* THREE: LIST OF DISTRICTS OR INITIATIVES TABLE */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-3xs space-y-4" id="portal-data-tables">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
              <Table className="w-4 h-4 text-emerald-600" />
              <span>
                {selectedDistrict === 'all' 
                  ? 'جدول ومخطط تتبع المديريات العام بمحافظة إب' 
                  : `سجل المبادرات الـ ${filteredInitiatives.length} النشطة بـ ${selectedDistrict}`}
              </span>
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {selectedDistrict === 'all' 
                ? 'مستند مالي وإداري مجمع لتتبع حجم الدعم والمساهمات ومعدلات الإنجاز على مستوى مديريات محافظة إب' 
                : 'تفاصيل المبادرات الميدانية وعزلها وقراها ونسب الإنجاز ونمط المساهمة المعتمد'}
            </p>
          </div>
          <div className="text-[10px] bg-slate-100 font-black text-slate-700 px-3 py-1 rounded-xl">
            سجلات مفرزة: <strong>{filteredInitiatives.length}</strong> سجل
          </div>
        </div>

        {selectedDistrict === 'all' ? (
          // GOVERNORATE PORTAL TABLE (12 districts overall summary)
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/60 text-slate-600 font-black">
                  <th className="p-3 text-slate-900 font-extrabold">المديرية</th>
                  <th className="p-3">عدد المبادرات</th>
                  <th className="p-3">التكلفة الإجمالية</th>
                  <th className="p-3">مساهمة المجتمع</th>
                  <th className="p-3">مساهمة الدولة</th>
                  <th className="p-3 text-center">متوسط الإنجاز</th>
                  <th className="p-3 text-left">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {governorateChartData.map((item, idx) => {
                  const rawName = `مديرية ${item.name}`;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-all text-slate-700">
                      <td className="p-3 font-extrabold text-slate-900">{rawName}</td>
                      <td className="p-3 font-mono">{item.count} مبادرات</td>
                      <td className="p-3 font-mono">{(item.cost).toLocaleString('ar-YE')} ريال</td>
                      <td className="p-3 font-mono text-emerald-700">{(item.community).toLocaleString('ar-YE')} ريال</td>
                      <td className="p-3 font-mono text-indigo-700">{(item.unit).toLocaleString('ar-YE')} ريال</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 justify-center">
                          <span className="font-mono font-bold text-[11px]">{item.avgProgress}%</span>
                          <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${item.avgProgress}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-left">
                        <button
                          onClick={() => handleDistrictChange(rawName)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                        >
                          دخول البوابة التفصيلية ←
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          // DISTRICT PORTAL TABLE (all initiatives of this district)
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/60 text-slate-600 font-black">
                  <th className="p-3 text-slate-900 font-extrabold">رقم المبادرة</th>
                  <th className="p-3">اسم المبادرة</th>
                  <th className="p-3">العزلة</th>
                  <th className="p-3">القرية</th>
                  <th className="p-3">التكلفة الكلية</th>
                  <th className="p-3">مساهمة المجتمع</th>
                  <th className="p-3 text-center">الإنجاز الفني</th>
                  <th className="p-3">الحالة الميدانية</th>
                  <th className="p-3 text-left">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredInitiatives.length > 0 ? (
                  filteredInitiatives.map((init) => (
                    <tr key={init.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="p-3 font-mono font-black text-slate-900">{init.initiativeNumber}</td>
                      <td className="p-3 font-extrabold text-slate-900 relative">
                        <span 
                          className="hover:text-emerald-700 transition-colors cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (hoveredPortalInitId === init.id) {
                              setHoveredPortalInitId(null);
                            } else {
                              setHoveredPortalInitId(init.id);
                            }
                          }}
                          onMouseEnter={() => setHoveredPortalInitId(init.id)}
                          onMouseLeave={() => setHoveredPortalInitId(null)}
                          title="المس بالماوس لرؤية الاسم كاملاً"
                        >
                          {init.name}
                        </span>

                        {hoveredPortalInitId === init.id && (
                          <div 
                            className="absolute z-50 bottom-full right-0 mb-2 w-80 bg-slate-900 text-white text-xs rounded-xl p-3.5 shadow-xl border border-slate-700 leading-relaxed font-bold animate-fadeIn"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex justify-between items-center gap-2 mb-1.5 pb-1 border-b border-slate-800">
                              <span className="text-emerald-400 text-[10px] font-black">📝 تفاصيل المبادرة والمواد:</span>
                              <button 
                                type="button"
                                className="text-slate-400 hover:text-white font-extrabold text-[10px] px-1 bg-slate-800 rounded"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setHoveredPortalInitId(null);
                                }}
                              >
                                  إغلاق ✕
                              </button>
                            </div>
                            <p className="text-white text-xs leading-relaxed select-all font-semibold mb-1">{init.name}</p>
                            
                            {/* Display Cement and Diesel dynamic info */}
                            {renderMaterialsTooltipInfo(init)}

                            <div className="absolute top-full right-6 w-3 h-3 bg-slate-900 transform rotate-45 border-r border-b border-slate-700"></div>
                          </div>
                        )}
                      </td>
                      <td className="p-3">{init.subDistrict}</td>
                      <td className="p-3">{init.village || 'غير محدد'}</td>
                      <td className="p-3 font-mono">{(init.cost || 0).toLocaleString('ar-YE')} ريال</td>
                      <td className="p-3 font-mono text-emerald-700">{(init.communityContribution || 0).toLocaleString('ar-YE')} ريال</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 justify-center">
                          <span className="font-mono font-bold text-[11px]">{init.completionRate}%</span>
                          <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${init.completionRate}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          init.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          init.status === 'stagnant' ? 'bg-rose-50 text-rose-700 border border-rose-100 animate-pulse' :
                          init.status === 'stopped' ? 'bg-slate-50 text-slate-700 border border-slate-200' :
                          init.status === 'ongoing' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                          'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {init.status === 'completed' ? 'منجز ✓' :
                           init.status === 'ongoing' ? 'قيد التنفيذ 🚧' :
                           init.status === 'stagnant' ? 'متعثر ⚠️' :
                           init.status === 'stopped' ? 'متوقف 🛑' : 'لم يبدأ ⏳'}
                        </span>
                      </td>
                      <td className="p-3 text-left">
                        <div className="flex items-center gap-1.5 justify-end">
                          {userRole === 'admin' && (
                            <button
                              onClick={() => {
                                setEditingInitiative(JSON.parse(JSON.stringify(init))); // deep copy
                                setActivePathwayTab(1);
                              }}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black rounded-lg transition-all cursor-pointer inline-flex items-center gap-0.5 shadow-3xs"
                              title="تعديل المبادرة"
                            >
                              <Pencil className="w-2.5 h-2.5" />
                              <span>تعديل ✏️</span>
                            </button>
                          )}
                          {onSelectInitiative && (
                            <button
                              onClick={() => onSelectInitiative(init.id)}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer shrink-0"
                            >
                              المسارات والمهام ←
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-400 font-bold">
                      لا توجد مبادرات مطابقة للبحث أو معايير التصفية.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* التقرير الإحصائي العام والتقارير التفصيلية للمديريات "بنفس الكيفية" */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-3xs space-y-6">
        <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">📊</span>
              <span>التقارير الإحصائية المطابقة للمديريات ومستوى المحافظة</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              مقارنة رقمية وتتبع توازني لمساهمات المجتمع والدولة ومعدلات الإنجاز بين كافة المديريات بنفس الكيفية
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 max-w-xs w-full">
            <span className="text-[11px] text-slate-400 font-bold">تصفية التقارير:</span>
            <input
              type="text"
              value={reportSearchQuery}
              onChange={(e) => setReportSearchQuery(e.target.value)}
              placeholder="ابحث باسم المديرية..."
              className="bg-transparent text-xs font-bold text-slate-700 outline-hidden placeholder-slate-400 w-full"
            />
          </div>
        </div>

        {/* 1. التقرير الإحصائي العام للمحافظة ككل */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block animate-pulse"></span>
              <h4 className="text-xs font-black tracking-wider uppercase">التقرير الإحصائي العام لمحافظة إب (المحافظة ككل)</h4>
            </div>
            <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-md">مستند مجمع</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Metric 1 */}
            <div className="bg-slate-800/80 border border-slate-800 rounded-xl p-3">
              <span className="text-slate-400 text-[10px] font-bold block">إجمالي المبادرات المفعّلة</span>
              <span className="text-base font-mono font-black text-white mt-1 block">{initiatives.length} مبادرة</span>
            </div>
            {/* Metric 2 */}
            <div className="bg-slate-800/80 border border-slate-800 rounded-xl p-3">
              <span className="text-slate-400 text-[10px] font-bold block">إجمالي كلفة التمويل</span>
              <span className="text-base font-mono font-black text-white mt-1 block">
                {(initiatives.reduce((acc, curr) => acc + (curr.cost || 0), 0) / 1000000).toFixed(2)} مليون ريال
              </span>
            </div>
            {/* Metric 3 */}
            <div className="bg-slate-800/80 border border-slate-800 rounded-xl p-3">
              <span className="text-slate-400 text-[10px] font-bold block">المساهمة المجتمعية العامة</span>
              <span className="text-base font-mono font-black text-emerald-400 mt-1 block">
                {(initiatives.reduce((acc, curr) => acc + (curr.communityContribution || 0), 0) / 1000000).toFixed(2)} مليون
              </span>
              <span className="text-[9px] text-emerald-500 font-extrabold block">
                {Math.round((initiatives.reduce((acc, curr) => acc + (curr.communityContribution || 0), 0) / (initiatives.reduce((acc, curr) => acc + (curr.cost || 0), 0) || 1)) * 100)}% من التكلفة العامة
              </span>
            </div>
            {/* Metric 4 */}
            <div className="bg-slate-800/80 border border-slate-800 rounded-xl p-3">
              <span className="text-slate-400 text-[10px] font-bold block">مساهمة الوحدة التنموية</span>
              <span className="text-base font-mono font-black text-indigo-400 mt-1 block">
                {(initiatives.reduce((acc, curr) => acc + (curr.unitContribution || 0), 0) / 1000000).toFixed(2)} million
              </span>
              <span className="text-[9px] text-indigo-500 font-extrabold block">
                {Math.round((initiatives.reduce((acc, curr) => acc + (curr.unitContribution || 0), 0) / (initiatives.reduce((acc, curr) => acc + (curr.cost || 0), 0) || 1)) * 100)}% دعم أسمنت ومواد
              </span>
            </div>
            {/* Metric 5 */}
            <div className="bg-slate-800/80 border border-slate-800 rounded-xl p-3">
              <span className="text-slate-400 text-[10px] font-bold block">متوسط الإنجاز المالي والعملي</span>
              <span className="text-base font-mono font-black text-white mt-1 block">
                {Math.round(initiatives.reduce((acc, curr) => acc + (curr.completionRate || 0), 0) / (initiatives.length || 1))}%
              </span>
              <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden mt-1.5">
                <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${Math.round(initiatives.reduce((acc, curr) => acc + (curr.completionRate || 0), 0) / (initiatives.length || 1))}%` }}></div>
              </div>
            </div>
          </div>

          {/* قسم خاص بالمديريات المتعثرة ومبادراتها النشطة حسب الرصد الواقعي في الملف المستورد */}
          <div className="bg-slate-950/70 border border-slate-800/85 rounded-xl p-4 mt-4 space-y-3" id="stagnant-report-panel">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-rose-500 text-sm">⚠️</span>
                <h5 className="text-xs font-black text-rose-400">تحليل رصد التعثر: المديريات المتعثرة والمبادرات الميدانية (مطابق للملف المستورد)</h5>
              </div>
              <span className="text-[10px] text-slate-400 bg-rose-950/60 border border-rose-900/30 px-2 py-0.5 rounded-md font-mono">
                إجمالي المبادرات المتعثرة: {initiatives.filter(i => i.status === 'stagnant').length} مبادرات بمحافظة إب
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* قائمة المديريات ذات التعثر */}
              <div className="lg:col-span-4 space-y-2">
                <span className="text-[10px] font-black text-slate-400 block mb-1">المديريات المتأثرة بالتعثر:</span>
                {districtsStats.filter(d => d.stagnantCount > 0).length === 0 ? (
                  <div className="text-center p-4 text-xs text-slate-500 bg-slate-900/40 rounded-lg border border-slate-800/60">
                    لا توجد أي مديريات متعثرة حالياً في النظام 🎉
                  </div>
                ) : (
                  districtsStats
                    .filter(d => d.stagnantCount > 0)
                    .map((d, index) => (
                      <div key={index} className="bg-slate-900/60 border border-rose-950/50 p-3 rounded-xl flex items-center justify-between" id={`stagnant-dist-${index}`}>
                        <div className="space-y-0.5">
                          <span className="text-xs font-black text-slate-200 block">{d.districtName}</span>
                          <span className="text-[9px] text-slate-400 block">نسبة التعثر: {Math.round((d.stagnantCount / (d.totalCount || 1)) * 100)}% من مبادراتها</span>
                        </div>
                        <div className="bg-rose-950/80 border border-rose-900 text-rose-400 font-mono font-black text-[11px] px-2.5 py-1 rounded-lg">
                          {d.stagnantCount} متعثرة ⚠️
                        </div>
                      </div>
                    ))
                )}
              </div>

              {/* تفاصيل المبادرات الخمس المتعثرة وأسبابها الفعلية */}
              <div className="lg:col-span-8 bg-slate-900/30 border border-slate-800/60 p-3 rounded-xl space-y-2">
                <span className="text-[10px] font-black text-slate-400 block mb-1 flex items-center gap-1">
                  <span>ℹ️</span>
                  <span>تفاصيل المبادرات المتعثرة وأسباب التعثر الفعلية في الميدان:</span>
                </span>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                  {initiatives.filter(i => i.status === 'stagnant').length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-500">لا توجد تفاصيل مبادرات متعثرة.</div>
                  ) : (
                    initiatives
                      .filter(i => i.status === 'stagnant')
                      .map((init, idx) => (
                        <div key={idx} className="bg-slate-950/55 border border-rose-950/30 p-2.5 rounded-lg space-y-1" id={`stagnant-init-card-${idx}`}>
                          <div className="flex items-start justify-between gap-2 text-[11px] font-bold">
                            <span className="text-slate-100 font-black leading-tight">{init.name}</span>
                            <span className="text-[9px] font-black text-rose-400 bg-rose-950/40 border border-rose-950 px-1.5 py-0.5 rounded shrink-0">
                              {init.district} - عزلة {init.subDistrict || 'غير حدد'}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9.5px] text-slate-400 mt-1">
                            <span>📍 <strong>القرية:</strong> {init.village || 'غير محدد'}</span>
                            <span>💰 <strong>كلفة المبادرة:</strong> {init.cost?.toLocaleString('ar-YE') || '0'} ريال</span>
                            <span>📈 <strong>نسبة الإنجاز:</strong> <span className="font-mono text-amber-400 font-bold">{init.completionRate}%</span></span>
                          </div>
                          <div className="text-[9.5px] text-amber-300 bg-amber-950/30 border border-amber-900/30 p-2 rounded mt-1 text-justify leading-relaxed">
                            <strong className="text-amber-400">سبب التعثر الفعلي بالملف:</strong> {init.stagnationReason || init.notes || 'سبب التعثر غير موثق بالبيانات الحالية'}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. التقارير الإحصائية للمديريات بنفس الكيفية */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-indigo-600 block"></span>
            <h4 className="text-xs font-black text-slate-800">التقارير الإحصائية التفصيلية لمديريات محافظة إب (بنفس الكيفية)</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {districtsStats
              .filter(d => d.districtName.includes(reportSearchQuery))
              .map((dist, idx) => (
                <div key={idx} className="border border-slate-150 rounded-2xl p-4 space-y-3 hover:shadow-xs transition-all bg-slate-50/50">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-extrabold text-slate-900">{dist.districtName}</span>
                    <button
                      onClick={() => handleDistrictChange(dist.districtName)}
                      className="text-[9px] bg-slate-900 text-white hover:bg-emerald-600 px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer"
                    >
                      استعراض على الخريطة ←
                    </button>
                  </div>

                  <div className="grid grid-cols-5 gap-2 text-center">
                    <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                      <span className="text-[8px] text-slate-400 font-bold block leading-none">المبادرات</span>
                      <span className="text-[11px] font-mono font-black text-slate-800 mt-1 block">{dist.totalCount}</span>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                      <span className="text-[8px] text-slate-400 font-bold block leading-none">الكلفة</span>
                      <span className="text-[11px] font-mono font-black text-slate-800 mt-1 block leading-none">
                        {(dist.totalCost / 1000000).toFixed(1)}M
                      </span>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                      <span className="text-[8px] text-slate-400 font-bold block leading-none">المجتمع</span>
                      <span className="text-[11px] font-mono font-black text-emerald-700 mt-1 block leading-none">
                        {dist.commPct}%
                      </span>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                      <span className="text-[8px] text-slate-400 font-bold block leading-none">الوحدة</span>
                      <span className="text-[11px] font-mono font-black text-indigo-700 mt-1 block leading-none">
                        {dist.unitPct}%
                      </span>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                      <span className="text-[8px] text-slate-400 font-bold block leading-none">الإنجاز</span>
                      <span className="text-[11px] font-mono font-black text-slate-800 mt-1 block leading-none">
                        {dist.avgProgress}%
                      </span>
                    </div>
                  </div>

                  {/* Status distribution inside each district */}
                  <div className="flex flex-wrap gap-1 justify-center border-t border-slate-100/80 pt-2 text-[8px] font-extrabold text-slate-500">
                    <span className="flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block"></span>
                      منجزة: {dist.completedCount}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 block"></span>
                      مستمرة: {dist.ongoingCount}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 block"></span>
                      متعثرة: {dist.stagnantCount}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 block"></span>
                      متوقفة: {dist.stoppedCount}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 block"></span>
                      لم تبدأ: {dist.pendingCount}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Interactive Edit Initiative & Task Details Modal (Admin only) */}
      {editingInitiative && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] text-slate-800">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center text-slate-950">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base">تعديل وتصحيح بيانات المبادرة والمسارات</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">لوحة التحكم السحابية للمسؤول 🔑 • تعديل فوري ومطابق</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingInitiative(null)}
                className="text-slate-400 hover:text-white font-extrabold text-sm px-2.5 py-1.5 bg-slate-800 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-right flex-1">
              {/* Row 1: Quick info alert */}
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-xs font-bold text-amber-900 leading-relaxed">
                📢 يتيح لك هذا المحرر تعديل مسمى المبادرة أو تعديل تفاصيل ومخرجات وادعاءات أي مهمة داخل المسارات الخمسة في حال وجود خطأ مستورد من جدول البيانات. التغييرات تحفظ فوراً ومحلياً وسحابياً.
              </div>

              {/* Row 2: Base Fields Grid */}
              <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-black text-slate-900 border-r-4 border-indigo-600 pr-2">١. البيانات الأساسية والجغرافية للمبادرة</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-700 block">اسم المبادرة الأهلي:</label>
                    <input
                      type="text"
                      required
                      value={editingInitiative.name}
                      onChange={(e) => setEditingInitiative({ ...editingInitiative, name: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-700 block">رقم المبادرة التسلسلي:</label>
                    <input
                      type="text"
                      value={editingInitiative.initiativeNumber || ''}
                      onChange={(e) => setEditingInitiative({ ...editingInitiative, initiativeNumber: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-700 block">حالة المبادرة الحالية:</label>
                    <select
                      value={editingInitiative.status}
                      onChange={(e) => setEditingInitiative({ ...editingInitiative, status: e.target.value as any })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="ongoing">قيد التنفيذ 🚧</option>
                      <option value="completed">منجز ومكتمل ✓</option>
                      <option value="stagnant">متعثر ⚠️</option>
                      <option value="stopped">متوقف 🛑</option>
                      <option value="pending">لم يبدأ بعد ⏳</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-700 block">المديرية:</label>
                    <input
                      type="text"
                      disabled
                      value={editingInitiative.district}
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 font-bold cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-700 block">العزلة:</label>
                    <input
                      type="text"
                      value={editingInitiative.subDistrict || ''}
                      onChange={(e) => setEditingInitiative({ ...editingInitiative, subDistrict: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-700 block">القرية المحاذية:</label>
                    <input
                      type="text"
                      value={editingInitiative.village || ''}
                      onChange={(e) => setEditingInitiative({ ...editingInitiative, village: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-700 block">التكلفة التقديرية الكلية (بالريال):</label>
                    <input
                      type="number"
                      value={editingInitiative.cost || 0}
                      onChange={(e) => setEditingInitiative({ ...editingInitiative, cost: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-700 block">نسبة الإنجاز الميداني (%):</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={editingInitiative.completionRate}
                      onChange={(e) => {
                        const val = Math.min(100, Math.max(0, Number(e.target.value)));
                        setEditingInitiative({ ...editingInitiative, completionRate: val });
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Pathways and Tasks Details */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-100 px-5 py-3 border-b border-slate-200">
                  <h4 className="text-xs font-black text-slate-900">٢. تعديل مسميات وتفاصيل مهام المسارات الخمسة التنموية</h4>
                </div>

                {/* Pathway Tab Selector */}
                <div className="bg-slate-50 flex border-b border-slate-200 overflow-x-auto scrollbar-none">
                  {[1, 2, 3, 4, 5].map((idx) => {
                    const pathObj = (editingInitiative.pathways || []).find(p => p.id === idx);
                    // Standard display titles
                    let title = `المسار ${idx}`;
                    if (idx === 1) title = 'المسار ١: التشخيص الفني';
                    else if (idx === 2) title = 'المسار ٢: اللجان العينية';
                    else if (idx === 3) title = 'المسار ٣: المعالجات والمناقلات';
                    else if (idx === 4) title = 'المسار ٤: الإعلام والتوجيه';
                    else if (idx === 5) title = 'المسار ٥: الرقابة والمطابقة';

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActivePathwayTab(idx)}
                        className={`px-4 py-3 text-xs font-black transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                          activePathwayTab === idx 
                            ? 'border-indigo-600 bg-white text-indigo-700' 
                            : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                        }`}
                      >
                        {title}
                      </button>
                    );
                  })}
                </div>

                {/* Pathway Tab Content - Tasks List */}
                <div className="p-5 space-y-4 bg-white">
                  {(() => {
                    const currentPath = (editingInitiative.pathways || []).find(p => p.id === activePathwayTab);
                    if (!currentPath) {
                      return <div className="text-xs text-slate-400 font-bold text-center py-4">لا توجد مهام مدرجة في هذا المسار.</div>;
                    }

                    return (
                      <div className="space-y-4">
                        <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl">
                          <span className="text-[10px] text-indigo-700 font-extrabold uppercase block">المسار المختار حالياً:</span>
                          <span className="text-xs text-indigo-950 font-black">
                            {activePathwayTab === 3 ? 'المسار الثالث: المعالجات والمناقلات' : currentPath.title}
                          </span>
                        </div>

                        <div className="space-y-4 divide-y divide-slate-100">
                          {currentPath.tasks.map((task, tIdx) => (
                            <div key={task.id} className="pt-4 first:pt-0 space-y-3">
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-[10px] bg-slate-200 text-slate-700 font-extrabold px-2 py-0.5 rounded-md font-mono">
                                  رمز المهمة: {task.id}
                                </span>
                                
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={task.completed}
                                    onChange={(e) => {
                                      const updatedPathways = (editingInitiative.pathways || []).map(p => {
                                        if (p.id === activePathwayTab) {
                                          return {
                                            ...p,
                                            tasks: p.tasks.map(t => {
                                              if (t.id === task.id) {
                                                return { 
                                                  ...t, 
                                                  completed: e.target.checked,
                                                  completedAt: e.target.checked ? new Date().toISOString().split('T')[0] : undefined
                                                };
                                              }
                                              return t;
                                            })
                                          };
                                        }
                                        return p;
                                      });
                                      setEditingInitiative({
                                        ...editingInitiative,
                                        pathways: updatedPathways
                                      });
                                    }}
                                    className="w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                  />
                                  <span className="text-xs font-black text-slate-900">تم إنجاز المهمة ميدانياً</span>
                                </label>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-slate-600">مسمى المهمة الرئيسي:</label>
                                  <input
                                    type="text"
                                    value={task.title}
                                    onChange={(e) => {
                                      const updatedPathways = (editingInitiative.pathways || []).map(p => {
                                        if (p.id === activePathwayTab) {
                                          return {
                                            ...p,
                                            tasks: p.tasks.map(t => {
                                              if (t.id === task.id) {
                                                return { ...t, title: e.target.value };
                                              }
                                              return t;
                                            })
                                          };
                                        }
                                        return p;
                                      });
                                      setEditingInitiative({
                                        ...editingInitiative,
                                        pathways: updatedPathways
                                      });
                                    }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:bg-white"
                                  />
                                </div>

                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-slate-600">ملاحظات ووثائق التنفيذ:</label>
                                  <input
                                    type="text"
                                    placeholder="وثائق الاستلام، التقارير المرفوعة..."
                                    value={task.notes || ''}
                                    onChange={(e) => {
                                      const updatedPathways = (editingInitiative.pathways || []).map(p => {
                                        if (p.id === activePathwayTab) {
                                          return {
                                            ...p,
                                            tasks: p.tasks.map(t => {
                                              if (t.id === task.id) {
                                                return { ...t, notes: e.target.value };
                                              }
                                              return t;
                                            })
                                          };
                                        }
                                        return p;
                                      });
                                      setEditingInitiative({
                                        ...editingInitiative,
                                        pathways: updatedPathways
                                      });
                                    }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:bg-white"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-600">وصف المهمة التفصيلي:</label>
                                <textarea
                                  rows={2}
                                  value={task.description}
                                  onChange={(e) => {
                                    const updatedPathways = (editingInitiative.pathways || []).map(p => {
                                      if (p.id === activePathwayTab) {
                                        return {
                                          ...p,
                                          tasks: p.tasks.map(t => {
                                            if (t.id === task.id) {
                                              return { ...t, description: e.target.value };
                                            }
                                            return t;
                                          })
                                        };
                                      }
                                      return p;
                                    });
                                    setEditingInitiative({
                                      ...editingInitiative,
                                      pathways: updatedPathways
                                    });
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:bg-white"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setEditingInitiative(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-black transition-all cursor-pointer"
              >
                تراجع وإلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!editingInitiative.name.trim()) {
                    alert('عفواً، يجب كتابة اسم المبادرة!');
                    return;
                  }
                  
                  // Ensure pathway titles are normalized
                  const normalizedPathways = (editingInitiative.pathways || []).map(p => ({
                    ...p,
                    title: p.id === 3 || p.title.includes('المسار الثالث') ? 'المسار الثالث: المعالجات والمناقلات' : p.title
                  }));

                  const finalInitiative = {
                    ...editingInitiative,
                    pathways: normalizedPathways
                  };

                  if (onUpdateInitiative) {
                    onUpdateInitiative(finalInitiative);
                  }
                  setEditingInitiative(null);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
              >
                <span>حفظ التعديلات سحابياً 💾</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
