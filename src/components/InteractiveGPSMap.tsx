import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  MapPin, 
  Search, 
  Filter, 
  Maximize2, 
  Minimize2, 
  Plus, 
  Minus, 
  RotateCcw, 
  Info, 
  Layers, 
  TrendingUp, 
  Coins, 
  CheckCircle2, 
  AlertTriangle,
  Locate
} from 'lucide-react';
import { Initiative } from '../types';

interface InteractiveGPSMapProps {
  initiatives: Initiative[];
  onSelectInitiative?: (id: string) => void;
  isDarkTheme?: boolean;
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

const DISTRICTS_LIST = [
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

interface MapTileProps {
  tile: { x: number; y: number; z: number };
  left: number;
  top: number;
  width: number;
  height: number;
  mapLayer: string;
}

const MapTile = ({ tile, left, top, width, height, mapLayer }: MapTileProps) => {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  // High-performance, rate-limit free tile mirrors
  const sources = [
    `https://basemaps.cartocdn.com/rastertiles/voyager/${tile.z}/${tile.x}/${tile.y}.png`,
    `https://tile.openstreetmap.org/${tile.z}/${tile.x}/${tile.y}.png`,
    `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${tile.z}/${tile.y}/${tile.x}`,
    `https://basemaps.cartocdn.com/dark_all/${tile.z}/${tile.x}/${tile.y}.png`
  ];

  if (hasError) return null;

  return (
    <img
      src={sources[sourceIndex]}
      alt=""
      referrerPolicy="no-referrer"
      className="absolute border-[0.2px] border-slate-900/10 transition-opacity duration-300"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        width: `${width}%`,
        height: `${height}%`,
        opacity: mapLayer === 'hybrid' ? 0.94 : 1,
      }}
      onError={() => {
        if (sourceIndex < sources.length - 1) {
          setSourceIndex(prev => prev + 1);
        } else {
          setHasError(true);
        }
      }}
    />
  );
};

export default function InteractiveGPSMap({ initiatives, onSelectInitiative, isDarkTheme = false }: InteractiveGPSMapProps) {
  const [selectedDistrict, setSelectedDistrict] = useState('all');

  const currentBounds = useMemo(() => {
    return DISTRICT_BOUNDS[selectedDistrict] || DISTRICT_BOUNDS['all'];
  }, [selectedDistrict]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubDistrict, setSelectedSubDistrict] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [modalInitiative, setModalInitiative] = useState<Initiative | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const flyToMarker = (marker: any) => {
    setIsAnimating(true);
    const targetZoom = 2.4;
    const pos = getXY(marker.lat, marker.lng);
    const targetX = dimensions.width / 2 - (pos.x / 100) * (dimensions.width * targetZoom);
    const targetY = dimensions.height / 2 - (pos.y / 100) * (dimensions.height * targetZoom);
    
    setZoom(targetZoom);
    setPanOffset({ x: targetX, y: targetY });
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 850);
  };
  
  // Map View State
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Map layer type: 'satellite' for pure Google Earth view, 'hybrid' for satellite with overlays, 'topo' for schematic
  const [mapLayer, setMapLayer] = useState<'satellite' | 'hybrid' | 'topo'>('satellite');

  // Track map container dimensions dynamically
  const [dimensions, setDimensions] = useState({ width: 800, height: 420 });

  useEffect(() => {
    if (mapContainerRef.current) {
      setDimensions({
        width: mapContainerRef.current.clientWidth || 800,
        height: mapContainerRef.current.clientHeight || 420
      });

      const observer = new ResizeObserver((entries) => {
        if (entries[0]) {
          setDimensions({
            width: Math.round(entries[0].contentRect.width) || 800,
            height: Math.round(entries[0].contentRect.height) || 420
          });
        }
      });
      observer.observe(mapContainerRef.current);
      return () => observer.disconnect();
    }
  }, []);

  // Calculate coordinates of the visible bounds inside the map container
  const visibleBounds = useMemo(() => {
    const { width, height } = dimensions;
    
    // Percentage boundaries of visible area inside the scaled element
    // Clamp to prevent weird extremes during dragging or zooming
    const pctLeft = -panOffset.x / (width * zoom) * 100;
    const pctRight = (width - panOffset.x) / (width * zoom) * 100;
    const pctTop = -panOffset.y / (height * zoom) * 100;
    const pctBottom = (height - panOffset.y) / (height * zoom) * 100;

    const latRange = currentBounds.latMax - currentBounds.latMin;
    const lngRange = currentBounds.lngMax - currentBounds.lngMin;

    // Convert percentages back to Lat/Lng
    const lngMinVisible = Math.max(currentBounds.lngMin - 0.05, currentBounds.lngMin + (pctLeft / 100) * lngRange);
    const lngMaxVisible = Math.min(currentBounds.lngMax + 0.05, currentBounds.lngMin + (pctRight / 100) * lngRange);
    
    const latMinVisible = Math.max(currentBounds.latMin - 0.05, currentBounds.latMin + ((100 - pctBottom) / 100) * latRange);
    const latMaxVisible = Math.min(currentBounds.latMax + 0.05, currentBounds.latMin + ((100 - pctTop) / 100) * latRange);

    return {
      latMin: latMinVisible,
      latMax: latMaxVisible,
      lngMin: lngMinVisible,
      lngMax: lngMaxVisible
    };
  }, [dimensions, zoom, panOffset, currentBounds]);

  // Calculate satellite tiles to show based on zoom level (capped at zoom level 14 to prevent high-frequency rate limiting)
  const tileZoom = useMemo(() => {
    if (zoom < 1.5) return 12;
    if (zoom < 3.0) return 13;
    return 14; // Cap tile zoom level at 14 for optimal performance and rate-limit prevention
  }, [zoom]);

  const satelliteTiles = useMemo(() => {
    const z = tileZoom;
    const lngToTileX = (lng: number) => (lng + 180) / 360 * Math.pow(2, z);
    const latToTileY = (lat: number) => {
      const latRad = lat * Math.PI / 180;
      return (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * Math.pow(2, z);
    };

    // Find bounding tile coordinates of the visible region only
    const xMin = Math.floor(lngToTileX(visibleBounds.lngMin));
    const xMax = Math.floor(lngToTileX(visibleBounds.lngMax));
    const yMin = Math.floor(latToTileY(visibleBounds.latMax));
    const yMax = Math.floor(latToTileY(visibleBounds.latMin));

    const tiles = [];
    const countX = xMax - xMin + 1;
    const countY = yMax - yMin + 1;

    // Cap tile generation count to 36 max per frame to avoid rate limits
    if (countX > 0 && countY > 0 && countX * countY <= 36) {
      for (let x = xMin; x <= xMax; x++) {
        for (let y = yMin; y <= yMax; y++) {
          tiles.push({ x, y, z });
        }
      }
    } else {
      // Fallback: Default bounding box tiles at lower zoom to ensure user always sees a map
      const fallbackZ = Math.min(z, 12);
      const fallbackLngToTileX = (lng: number) => (lng + 180) / 360 * Math.pow(2, fallbackZ);
      const fallbackLatToTileY = (lat: number) => {
        const latRad = lat * Math.PI / 180;
        return (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * Math.pow(2, fallbackZ);
      };
      const fxMin = Math.floor(fallbackLngToTileX(currentBounds.lngMin));
      const fxMax = Math.floor(fallbackLngToTileX(currentBounds.lngMax));
      const fyMin = Math.floor(fallbackLatToTileY(currentBounds.latMax));
      const fyMax = Math.floor(fallbackLatToTileY(currentBounds.latMin));
      for (let x = fxMin; x <= fxMax; x++) {
        for (let y = fyMin; y <= fyMax; y++) {
          tiles.push({ x, y, z: fallbackZ });
        }
      }
    }
    return tiles;
  }, [tileZoom, visibleBounds]);

  const tileToLatLng = (x: number, y: number, z: number) => {
    const n = Math.pow(2, z);
    const lng = x / n * 360 - 180;
    const latRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n)));
    const lat = latRad * 180 / Math.PI;
    return { lat, lng };
  };

  // Helper to get unique subdistricts
  const subDistricts = useMemo(() => {
    const list = new Set<string>();
    initiatives.forEach(init => {
      if (init.subDistrict) list.add(init.subDistrict);
    });
    return Array.from(list);
  }, [initiatives]);

  // Convert coordinate string or generate stable coordinates
  const mappedInitiatives = useMemo(() => {
    return initiatives.map((init, index) => {
      let lat = 13.824;
      let lng = 44.112;
      let hasRealCoords = false;

      // Try to parse from coordinates string (e.g. "13.824, 44.112")
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

      // If no valid coordinates found, distribute deterministically across the district's center
      if (!hasRealCoords) {
        const hash = init.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + index;
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

        // Spread them out slightly
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

  // Filtered Map Items
  const filteredMarkers = useMemo(() => {
    return mappedInitiatives.filter(marker => {
      const matchSearch = marker.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (marker.village && marker.village.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (marker.initiativeNumber && marker.initiativeNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchDistrict = selectedDistrict === 'all' || marker.district === selectedDistrict;
      const matchSub = selectedSubDistrict === 'all' || marker.subDistrict === selectedSubDistrict;
      const matchStatus = selectedStatus === 'all' || marker.status === selectedStatus;
      return matchSearch && matchDistrict && matchSub && matchStatus;
    });
  }, [mappedInitiatives, searchTerm, selectedDistrict, selectedSubDistrict, selectedStatus]);

  // Map coordinates to SVG viewbox percentage based on currentBounds
  const getXY = (lat: number, lng: number) => {
    // Normalization to 0..100%
    const latRange = currentBounds.latMax - currentBounds.latMin;
    const lngRange = currentBounds.lngMax - currentBounds.lngMin;
    
    // Invert Y because SVG coordinates start from top-left
    const yPercent = 100 - ((lat - currentBounds.latMin) / latRange) * 100;
    const xPercent = ((lng - currentBounds.lngMin) / lngRange) * 100;
    
    return { x: xPercent, y: yPercent };
  };

  // Drag Handlers for Panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left-click
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

  // Zoom Controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 8));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 0.8));
  const handleReset = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    setSelectedMarkerId(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Smooth zoom on mouse wheel scroll
    const isZoomIn = e.deltaY < 0;
    setZoom(prev => {
      const step = isZoomIn ? 0.25 : -0.25;
      const nextZoom = prev + step;
      return Math.max(0.8, Math.min(nextZoom, 8));
    });
  };

  const selectedMarker = useMemo(() => {
    return mappedInitiatives.find(m => m.id === selectedMarkerId) || null;
  }, [mappedInitiatives, selectedMarkerId]);

  return (
    <div className={`rounded-3xl border overflow-hidden flex flex-col ${
      isDarkTheme 
        ? 'bg-slate-950 border-slate-800 text-slate-100' 
        : 'bg-white border-slate-200 text-slate-800'
    }`} dir="rtl">
      
      {/* Map Header Panel */}
      <div className={`p-4 border-b flex items-center justify-between flex-wrap gap-4 ${
        isDarkTheme ? 'border-slate-800 bg-slate-900/40' : 'border-slate-100 bg-slate-50/50'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-600">
            <Layers className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>الخارطة الجغرافية التفاعلية لمبادرات طرق محافظة إب</span>
              <span className="bg-emerald-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-full">LIVE GPS</span>
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">تحديد إحداثيات ومواقع المبادرات التشاركية بكافة مديريات محافظة إب والتحقق من الانتشار الميداني بالعزل (دعم التشغيل أوفلاين بدون نت)</p>
          </div>
        </div>

        {/* Map Actions Quick info */}
        <div className="flex items-center gap-3">
          <div className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-bold px-3 py-1 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
            📌 معروض: <strong>{filteredMarkers.length}</strong> من <strong>{initiatives.length}</strong> مبادرة
          </div>
          <button 
            onClick={handleReset}
            className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
            title="إعادة ضبط اتجاه ومستوى تكبير الخريطة"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة الضبط</span>
          </button>
        </div>
      </div>

      {/* Map Control Filters Bar */}
      <div className={`p-3 border-b grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 ${
        isDarkTheme ? 'border-slate-800 bg-slate-900/20' : 'border-slate-100 bg-slate-50/20'
      }`}>
        {/* District Filter (Governorate/Districts selector) */}
        <div className="flex items-center gap-2">
          <Locate className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedDistrict}
            onChange={(e) => {
              setSelectedDistrict(e.target.value);
              setSelectedSubDistrict('all'); // Reset subdistrict filter when district changes
              setPanOffset({ x: 0, y: 0 }); // Reset pan
              setZoom(1); // Reset zoom
            }}
            className="bg-slate-100/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] rounded-xl p-2 w-full text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-hidden"
          >
            <option value="all">خارطة محافظة إب ككل 🇾🇪</option>
            {DISTRICTS_LIST.map((dist, idx) => (
              <option key={idx} value={dist}>{dist}</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث باسم المبادرة، القرية..."
            className="bg-slate-100/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pr-9 pl-3 py-2 text-[11px] text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 w-full"
          />
        </div>

        {/* Subdistrict filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedSubDistrict}
            onChange={(e) => setSelectedSubDistrict(e.target.value)}
            className="bg-slate-100/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] rounded-xl p-2 w-full text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-hidden"
          >
            <option value="all">كل العزل ({subDistricts.length})</option>
            {subDistricts.map((sub, idx) => (
              <option key={idx} value={sub}>{sub}</option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-100/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] rounded-xl p-2 w-full text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-hidden"
          >
            <option value="all">جميع الحالات والمواقف</option>
            <option value="completed">منجز ✓</option>
            <option value="ongoing">قيد التنفيذ 🚧</option>
            <option value="stagnant">متعثر ⚠️</option>
            <option value="stopped">متوقف 🛑</option>
            <option value="pending">لم يبدأ ⏳</option>
          </select>
        </div>
      </div>

      {/* Map Layout Canvas Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[420px]">
        
        {/* Main Map Interactive Viewport (col-span-3) */}
        <div className="lg:col-span-3 relative h-[420px] bg-gradient-to-br from-slate-950 via-emerald-950/30 to-slate-900 overflow-hidden cursor-grab active:cursor-grabbing border-b lg:border-b-0 lg:border-l border-slate-200 dark:border-slate-800"
          ref={mapContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onWheel={handleWheel}
        >
          {/* Topographic grid effect */}
          <div className={`absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none ${
            mapLayer === 'hybrid' ? 'opacity-[0.08]' : 'opacity-15'
          }`} />
          
          {/* Mountain contours simulated SVG background */}
          <svg className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity ${
            mapLayer === 'hybrid' ? 'opacity-[0.08]' : 'opacity-15'
          }`} xmlns="http://www.w3.org/2000/svg">
            <path d="M-50,150 Q200,50 400,250 T800,100" fill="none" stroke="#0ea5e9" strokeWidth="1.5" />
            <path d="M-100,220 Q150,300 350,150 T900,300" fill="none" stroke="#0ea5e9" strokeWidth="1" />
            <path d="M0,100 Q300,380 600,200 T1200,250" fill="none" stroke="#10b981" strokeWidth="0.8" />
          </svg>

          {/* Dhi As-Sufal Boundary and Subdistricts Centers Indicators */}
          <div 
            className="absolute inset-0 select-none origin-center"
            style={{
              transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
              transition: isAnimating ? 'transform 850ms cubic-bezier(0.15, 0.85, 0.25, 1)' : 'transform 100ms ease-out'
            }}
          >
            {/* Real Satellite Tiles Layer from Esri World Imagery (Google Earth level high-resolution) */}
            {(mapLayer === 'satellite' || mapLayer === 'hybrid') && (
              <div className="absolute inset-0 pointer-events-none select-none z-0">
                {satelliteTiles.map((tile) => {
                  const topLeft = tileToLatLng(tile.x, tile.y, tile.z);
                  const bottomRight = tileToLatLng(tile.x + 1, tile.y + 1, tile.z);
                  
                  const posTopLeft = getXY(topLeft.lat, topLeft.lng);
                  const posBottomRight = getXY(bottomRight.lat, bottomRight.lng);
                  
                  const left = posTopLeft.x;
                  const top = posTopLeft.y;
                  const width = posBottomRight.x - posTopLeft.x;
                  const height = posBottomRight.y - posTopLeft.y;

                  return (
                    <MapTile
                      key={`${tile.z}-${tile.x}-${tile.y}`}
                      tile={tile}
                      left={left}
                      top={top}
                      width={width}
                      height={height}
                      mapLayer={mapLayer}
                    />
                  );
                })}
              </div>
            )}

            {/* Visual Bounding outline of Ibb Governorate */}
            <div className={`absolute inset-[15%] border-2 border-dashed rounded-full flex items-center justify-center transition-all duration-300 z-10 ${
              mapLayer === 'topo' ? 'border-slate-800/60' : 'border-emerald-500/25'
            }`}>
              <span className={`text-[10px] font-black tracking-[0.2em] select-none transition-all duration-300 ${
                mapLayer === 'topo' ? 'text-slate-800/40' : 'text-emerald-400/30'
              }`}>نطاق محافظة إب</span>
            </div>

            {/* Sub-Districts Center Names floating labels */}
            {[
              { name: 'عزلة الجعاشن', lat: 13.810, lng: 44.070 },
              { name: 'عزلة ذي شراق', lat: 13.845, lng: 44.110 },
              { name: 'عزلة حبير', lat: 13.865, lng: 44.155 },
              { name: 'عزلة الصفة', lat: 13.780, lng: 44.130 },
              { name: 'عزلة الرونة وقحزة', lat: 13.830, lng: 44.180 },
              { name: 'عزلة شقح وخنوة', lat: 13.890, lng: 44.060 },
            ].map((sd, sIdx) => {
              const pos = getXY(sd.lat, sd.lng);
              return (
                <div 
                  key={sIdx} 
                  className={`absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[8px] font-black tracking-wider whitespace-nowrap transition-all duration-300 z-10 ${
                    mapLayer === 'topo' 
                      ? 'bg-slate-900/40 border border-slate-800/30 text-slate-500' 
                      : 'bg-black/80 border border-emerald-500/20 text-emerald-400 shadow-md'
                  }`}
                  style={{ top: `${pos.y}%`, left: `${pos.x}%` }}
                >
                  🏔️ {sd.name}
                </div>
              );
            })}

            {/* Map Markers (Active Initiatives) */}
            {filteredMarkers.map((marker) => {
              const pos = getXY(marker.lat, marker.lng);
              const isSelected = selectedMarkerId === marker.id;
              
              // Color based on status
              let markerColor = 'bg-slate-400 ring-slate-400/30 text-slate-400';
              if (marker.status === 'completed') markerColor = 'bg-emerald-500 ring-emerald-500/40 text-emerald-400';
              else if (marker.status === 'ongoing') markerColor = 'bg-indigo-500 ring-indigo-500/40 text-indigo-400';
              else if (marker.status === 'stagnant') markerColor = 'bg-rose-500 ring-rose-500/40 text-rose-400';
              else if (marker.status === 'stopped') markerColor = 'bg-amber-500 ring-amber-500/40 text-amber-500';

              return (
                <div
                  key={marker.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group transition-all"
                  style={{ top: `${pos.y}%`, left: `${pos.x}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMarkerId(marker.id);
                    setModalInitiative(marker);
                    setIsModalOpen(true);
                    flyToMarker(marker);
                  }}
                >
                  {/* Outer breathing ring for selected or ongoing */}
                  <span className={`absolute -inset-2.5 rounded-full ring-4 opacity-0 group-hover:opacity-100 transition-opacity ${
                    isSelected ? 'opacity-100 ring-emerald-500/20 scale-125' : 'ring-indigo-500/10'
                  }`}></span>

                  {/* Marker Pin */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition-transform ${markerColor} ${
                    isSelected ? 'scale-130 rotate-12 border border-white' : 'hover:scale-115'
                  }`}>
                    <MapPin className="w-3.5 h-3.5 text-white" />
                  </div>

                  {/* Progress Bubble attached */}
                  <div className="absolute -top-3.5 -left-1 bg-slate-950 text-[7px] font-mono font-black text-white px-1 rounded border border-slate-800/80">
                    {marker.completionRate}%
                  </div>

                  {/* Tiny Quick Hover tooltip */}
                  {!isSelected && (
                    <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                      <div className="bg-slate-900 border border-slate-800 text-white rounded-lg p-2 shadow-xl whitespace-nowrap text-right space-y-0.5">
                        <p className="text-[9px] font-black">{marker.name}</p>
                        <p className="text-[7.5px] text-slate-400">{marker.subDistrict} - {marker.village}</p>
                        <div className="flex gap-2 items-center justify-between text-[7.5px] pt-1 border-t border-slate-800 mt-1">
                          <span className="text-emerald-400">إنجاز: {marker.completionRate}%</span>
                          <span className="text-amber-400">{marker.cost ? (marker.cost / 1000000).toFixed(1) + 'M' : '0'} ريال</span>
                        </div>
                      </div>
                      <div className="w-1.5 h-1.5 bg-slate-900 border-r border-b border-slate-800 transform rotate-45 -mt-1"></div>
                    </div>
                  )}

                  {/* Persistent Selected Popup above the pin */}
                  {isSelected && (
                    <div 
                      className="absolute bottom-full right-1/2 translate-x-1/2 mb-3 z-35 flex flex-col items-center animate-fadeIn cursor-default" 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="bg-slate-950/95 backdrop-blur-md border-2 border-emerald-500 text-white rounded-xl p-3 shadow-2xl min-w-[190px] max-w-[240px] text-right space-y-1.5 relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMarkerId(null);
                          }}
                          className="absolute top-1 left-2 text-slate-400 hover:text-white hover:bg-slate-800 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center cursor-pointer transition-all"
                          title="إغلاق التلميح"
                        >
                          ✕
                        </button>
                        <p className="text-[10px] font-extrabold text-emerald-400 pr-4 leading-snug">{marker.name}</p>
                        <p className="text-[8.5px] text-slate-300">عزلة {marker.subDistrict} - {marker.village}</p>
                        <div className="flex gap-2 items-center justify-between text-[8px] pt-1.5 border-t border-slate-800/80 mt-1">
                          <span className="text-emerald-400 font-bold">إنجاز: {marker.completionRate}%</span>
                          <span className="text-amber-400 font-bold">{(marker.cost || 0).toLocaleString()} ريال</span>
                        </div>
                        <div className="text-[7.5px] text-slate-400 space-y-0.5 border-t border-slate-900/60 pt-1.5 mt-1 text-right">
                          <div className="flex justify-between">
                            <span>📦 الأسمنت المعتمد:</span>
                            <span className="text-slate-200 font-bold">{marker.materialsApproved || 'بانتظار الصرف'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>⛽ الديزل المعتمد:</span>
                            <span className="text-slate-200 font-bold">{marker.dieselApproved || 'بانتظار الصرف'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="w-2.5 h-2.5 bg-slate-950 border-r-2 border-b-2 border-emerald-500 transform rotate-45 -mt-1.5"></div>
                    </div>
                  )}

                </div>
              );
            })}

          </div>

          {/* Map Floating UI Controls */}
          <div className="absolute bottom-4 right-4 bg-slate-950/90 border border-slate-800 rounded-2xl p-2 flex flex-col gap-1.5 z-30 shadow-2xl">
            <button 
              onClick={handleZoomIn}
              className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 flex items-center justify-center cursor-pointer transition-colors"
              title="تكبير الخريطة"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button 
              onClick={handleZoomOut}
              className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 flex items-center justify-center cursor-pointer transition-colors"
              title="تصغير الخريطة"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button 
              onClick={handleReset}
              className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 flex items-center justify-center cursor-pointer transition-colors"
              title="إعادة ضبط مركز الخريطة"
            >
              <Locate className="w-4 h-4" />
            </button>
          </div>

          {/* Layer Selector Floating Widget */}
          <div className="absolute top-4 right-4 bg-slate-950/95 border border-slate-800 rounded-2xl p-1.5 flex gap-1 z-30 shadow-2xl backdrop-blur-md">
            <button
              onClick={() => setMapLayer('satellite')}
              className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                mapLayer === 'satellite'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
              title="عرض خارطة أقمار صناعية نقية مثل Google Earth"
            >
              <span>🌍 أقمار صناعية</span>
            </button>
            <button
              onClick={() => setMapLayer('hybrid')}
              className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                mapLayer === 'hybrid'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
              title="عرض خارطة قمر صناعي مع أسماء القرى والعزل والطرق"
            >
              <span>🗺️ خارطة هجينة حية</span>
            </button>
            <button
              onClick={() => setMapLayer('topo')}
              className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                mapLayer === 'topo'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
              title="الخارطة التخطيطية الرقمية الافتراضية"
            >
              <span>📉 تخطيطي</span>
            </button>
          </div>

          {/* Map Compass / Info Overlay */}
          <div className="absolute top-16 right-4 lg:top-4 lg:left-4 lg:right-auto bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 text-right z-30 space-y-1 text-slate-400 pointer-events-none max-w-[150px] backdrop-blur-sm">
            <span className="text-[8px] text-slate-500 font-bold block uppercase tracking-wider">نظام الإسناد الجغرافي:</span>
            <span className="text-[9px] font-black text-slate-200 block">
              {mapLayer === 'topo' ? 'WGS 84 / Schematic' : 'Esri Satellite / Live'}
            </span>
            <span className="text-[8px] text-slate-400 block mt-1">
              {mapLayer === 'topo' 
                ? 'مخطط تضاريسي افتراضي للمحافظة.' 
                : 'رصد فضائي تفصيلي لوديان وقرى محافظة إب.'}
            </span>
          </div>

          {/* Compass Rose */}
          <div className="absolute bottom-4 left-4 w-9 h-9 border border-slate-800/60 rounded-full flex items-center justify-center pointer-events-none opacity-40">
            <span className="text-[8px] text-white font-black absolute top-0.5">N</span>
            <span className="text-[8px] text-white font-black absolute bottom-0.5">S</span>
            <span className="text-[8px] text-white font-black absolute left-0.5">W</span>
            <span className="text-[8px] text-white font-black absolute right-0.5">E</span>
            <div className="w-0.5 h-6 bg-rose-500 transform rotate-45" />
          </div>

          {/* No markers warning */}
          {filteredMarkers.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-center p-6 z-30">
              <AlertTriangle className="w-10 h-10 text-amber-500 animate-bounce mb-3" />
              <p className="text-xs font-black text-white">لم يتم العثور على أي مبادرات مطابقة للفلاتر الحالية</p>
              <p className="text-[10px] text-slate-400 mt-1">يرجى تعديل خيارات البحث أو إعادة ضبط الفلترة لعرض المواقع</p>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSubDistrict('all');
                  setSelectedStatus('all');
                }}
                className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                مسح الفلاتر والبحث
              </button>
            </div>
          )}

        </div>

        {/* Selected Initiative Details Sidebar (col-span-1) */}
        <div className={`p-4 flex flex-col justify-between space-y-4 ${
          isDarkTheme ? 'bg-slate-900/40' : 'bg-slate-50/50'
        }`}>
          {selectedMarker ? (
            <div className="space-y-4 animate-fadeIn text-right h-full flex flex-col justify-between">
              
              <div className="space-y-3.5">
                {/* ID badge and subdistrict */}
                <div className="flex justify-between items-center flex-wrap gap-1">
                  <span className="text-[9px] bg-indigo-950 text-indigo-400 border border-indigo-900 font-mono px-2 py-0.5 rounded-md font-bold">
                    ID: {selectedMarker.initiativeNumber}
                  </span>
                  <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-bold">
                    عزلة {selectedMarker.subDistrict}
                  </span>
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white leading-relaxed">{selectedMarker.name}</h4>
                  <p className="text-[9.5px] text-slate-500">القرية/المحلّة: <strong className="text-slate-700 dark:text-slate-300">{selectedMarker.village}</strong></p>
                </div>

                {/* Progress bar and Status indicator */}
                <div className="space-y-1.5 bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-[9.5px] text-slate-400 font-bold">نسبة الإنجاز الميداني:</span>
                    <span className="text-[11px] font-mono font-black text-emerald-600 dark:text-emerald-400">{selectedMarker.completionRate}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${selectedMarker.completionRate}%` }}
                    />
                  </div>
                  
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center mt-1">
                    <span className="text-[9px] text-slate-400">حالة المبادرة:</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      selectedMarker.status === 'completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' :
                      selectedMarker.status === 'ongoing' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400' :
                      selectedMarker.status === 'stagnant' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 animate-pulse' :
                      selectedMarker.status === 'stopped' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' :
                      'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                    }`}>
                      {selectedMarker.status === 'completed' ? 'منجز' :
                       selectedMarker.status === 'ongoing' ? 'قيد التنفيذ' :
                       selectedMarker.status === 'stagnant' ? 'متعثر' :
                       selectedMarker.status === 'stopped' ? 'متوقف' : 'لم يبدأ'}
                    </span>
                  </div>
                </div>

                {/* Financial figures */}
                <div className="space-y-2 bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">التكلفة الكلية:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{(selectedMarker.cost || 0).toLocaleString()} ريال</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">✊ مساهمة المجتمع:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{(selectedMarker.communityContribution || 0).toLocaleString()} ريال</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">🏢 مساهمة الوحدة:</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{(selectedMarker.unitContribution || 0).toLocaleString()} ريال</span>
                  </div>
                </div>

                {/* Cement and Diesel Support Grid */}
                <div className="space-y-2 bg-emerald-50/20 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-150 dark:border-emerald-900/40 text-[10px]">
                  <h5 className="text-[9px] font-black text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5 mb-1 font-sans">
                    <span>📦</span>
                    <span>مواد الدعم المصروفة ميدانياً:</span>
                  </h5>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-sans">📦 الأسمنت المعتمد:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedMarker.materialsApproved || 'لا يوجد'}</span>
                  </div>
                  {selectedMarker.materialsUsed && (
                    <div className="flex justify-between text-[9px] text-slate-400">
                      <span className="font-sans">📦 المستهلك منه:</span>
                      <span className="font-bold">{selectedMarker.materialsUsed}</span>
                    </div>
                  )}
                  <div className="flex justify-between mt-1">
                    <span className="text-slate-500 dark:text-slate-400 font-sans">⛽ الديزل المعتمد:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedMarker.dieselApproved || 'لا يوجد'}</span>
                  </div>
                  {selectedMarker.dieselUsed && (
                    <div className="flex justify-between text-[9px] text-slate-400">
                      <span className="font-sans">⛽ المستهلك منه:</span>
                      <span className="font-bold">{selectedMarker.dieselUsed}</span>
                    </div>
                  )}
                </div>

                {/* Financial figures */}
                <div className="space-y-2 bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">التكلفة الكلية:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{(selectedMarker.cost || 0).toLocaleString()} ريال</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">✊ مساهمة المجتمع:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{(selectedMarker.communityContribution || 0).toLocaleString()} ريال</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">🏢 مساهمة الوحدة:</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{(selectedMarker.unitContribution || 0).toLocaleString()} ريال</span>
                  </div>
                </div>

                {/* Coordinates value display and custom map link */}
                <div className="bg-slate-100 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/40 dark:border-slate-800 text-[9px] font-mono text-slate-500">
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold mb-1">
                    <Locate className="w-3 h-3 text-indigo-400" />
                    <span>إحداثيات الموقع (GPS):</span>
                  </div>
                  <span className="text-slate-700 dark:text-slate-300 text-[10px] block truncate">{selectedMarker.coordinates || `${selectedMarker.lat.toFixed(4)}, ${selectedMarker.lng.toFixed(4)}`}</span>
                  
                  {selectedMarker.coordinates && (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedMarker.coordinates)}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold underline block mt-1 text-[8.5px]"
                    >
                      فتح في Google Maps الخارجية ↗
                    </a>
                  )}
                </div>

              </div>

              {/* View full details trigger action */}
              <button
                onClick={() => {
                  setModalInitiative(selectedMarker);
                  setIsModalOpen(true);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1 mt-4"
              >
                <span>معاينة كافة تفاصيل وبطاقة المشروع بالكامل 📋</span>
              </button>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-10 h-full text-slate-400 space-y-3">
              <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-full border border-slate-200/40 dark:border-slate-800">
                <MapPin className="w-6 h-6 text-slate-400 dark:text-slate-600 animate-bounce" />
              </div>
              <div className="max-w-[180px] space-y-1">
                <p className="text-xs font-black text-slate-700 dark:text-slate-300">مستكشف مواقع المبادرات</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">انقر فوق أي علامة دبوس (Pin) على الخريطة لعرض تفاصيل المبادرة وإحداثيات الرصد الخاصة بها فوراً.</p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* 🏛️ FULL PROJECT DETAILS POPUP MODAL (Triggers when clicking any pin on map) */}
      {isModalOpen && modalInitiative && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" dir="rtl">
          <div className="bg-slate-900 border-2 border-emerald-500/80 rounded-3xl p-6 text-slate-100 max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl relative">
            
            {/* Close Button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors"
              title="إغلاق النافذة"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="space-y-2 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-700/80 font-extrabold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                  <span>🧠</span>
                  <span>مصدر القرار: محرك القرار التنموي V1</span>
                </span>
                <span className="text-xs bg-indigo-950 text-indigo-400 border border-indigo-800 font-mono px-2.5 py-0.5 rounded-lg font-bold">
                  رقم المبادرة: {modalInitiative.initiativeNumber}
                </span>
                <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-0.5 rounded-lg font-bold">
                  {modalInitiative.governorate} - {modalInitiative.district}
                </span>
                <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-lg font-bold">
                  عزلة {modalInitiative.subDistrict} - قرية {modalInitiative.village}
                </span>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-lg ${
                  modalInitiative.status === 'completed' ? 'bg-emerald-500 text-white' :
                  modalInitiative.status === 'ongoing' ? 'bg-indigo-600 text-white' :
                  modalInitiative.status === 'stagnant' ? 'bg-rose-600 text-white animate-pulse' :
                  'bg-amber-600 text-white'
                }`}>
                  {modalInitiative.status === 'completed' ? 'منجز 100%' :
                   modalInitiative.status === 'ongoing' ? 'قيد التنفيذ' :
                   modalInitiative.status === 'stagnant' ? 'متعثر' : 'متوقف'}
                </span>
              </div>

              <h2 className="text-xl font-black text-white pt-2 leading-relaxed flex items-center gap-2">
                <span>📍</span>
                <span>{modalInitiative.name}</span>
              </h2>
            </div>

            {/* Completion Rate Progress */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs font-black">
                <span className="text-slate-300">مؤشر نسبة الإنجاز الميداني الفعلي:</span>
                <span className="text-emerald-400 font-mono text-sm">{modalInitiative.completionRate}%</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div 
                  className="bg-gradient-to-r from-emerald-600 to-teal-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${modalInitiative.completionRate}%` }}
                />
              </div>
            </div>

            {/* Financial Overview Grid */}
            <div className="space-y-2">
              <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>💰</span>
                <span>البيانات المالية والتكاليف التقديرية (ريال يمني):</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">التكلفة الكلية التقديرية</span>
                  <span className="text-sm font-black font-mono text-amber-400 block">
                    {(modalInitiative.cost || 0).toLocaleString()} ريال
                  </span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">مساهمة المجتمع</span>
                  <span className="text-sm font-black font-mono text-emerald-400 block">
                    {(modalInitiative.communityContribution || 0).toLocaleString()} ريال
                  </span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">مساهمة وحدة التدخلات</span>
                  <span className="text-sm font-black font-mono text-indigo-400 block">
                    {(modalInitiative.unitContribution || 0).toLocaleString()} ريال
                  </span>
                </div>
              </div>
            </div>

            {/* Technical Executed Quantities Grid */}
            <div className="space-y-2">
              <h3 className="text-xs font-black text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>🏗️</span>
                <span>حصر الأعمـال والتنفيذ الإنشائي الميداني:</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">عدد المستفيدين:</span>
                  <strong className="text-white font-mono text-sm block mt-0.5">{modalInitiative.beneficiaries || 1500} نسمة</strong>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">القطاع / الطبيعة:</span>
                  <strong className="text-slate-200 block mt-0.5">{modalInitiative.sector || 'طرق واعمال انشائية'}</strong>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">حالة إثبات الملكية:</span>
                  <strong className="text-emerald-400 block mt-0.5">{modalInitiative.ownerConfirmed ? 'موثقة ومؤكدة ✓' : 'قيد التدقيق'}</strong>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">تاريخ البدء والمتابعة:</span>
                  <strong className="text-slate-200 block mt-0.5">{modalInitiative.startDate || '٢٠٢٦-٠١-٠١'}</strong>
                </div>
              </div>
            </div>

            {/* Support Materials Breakdown (Cement & Diesel) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cement Details */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
                <h4 className="font-black text-emerald-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span>📦</span>
                  <span>دعم الإسمنت (أكياس):</span>
                </h4>
                <div className="space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">الاعتماد الكلي:</span>
                    <strong className="text-white">{modalInitiative.materialsApproved || 'بانتظار الصرف'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">المنصرف والمستلم:</span>
                    <strong className="text-indigo-400">{modalInitiative.materialsDisbursed || '0'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">المستخدم فعلياً:</span>
                    <strong className="text-emerald-400">{modalInitiative.materialsUsed || '0'}</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-900 text-amber-400">
                    <span>المتبقي التزام لدى الوحدة:</span>
                    <strong>{modalInitiative.materialsRemaining || '0'}</strong>
                  </div>
                </div>
              </div>

              {/* Diesel Details */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
                <h4 className="font-black text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span>⛽</span>
                  <span>دعم الوقود والديزل (لتر):</span>
                </h4>
                <div className="space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">الاعتماد الكلي:</span>
                    <strong className="text-white">{modalInitiative.dieselApproved || 'بانتظار الصرف'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">المنصرف والمستلم:</span>
                    <strong className="text-indigo-400">{modalInitiative.dieselDisbursed || '0'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">المستهلك فعلياً:</span>
                    <strong className="text-emerald-400">{modalInitiative.dieselUsed || '0'}</strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-900 text-amber-400">
                    <span>المتبقي التزام لدى الوحدة:</span>
                    <strong>{modalInitiative.dieselRemaining || '0'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Location & GPS Link */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">الموقع الجغرافي والإحداثيات (GPS):</span>
                <span className="text-slate-200 font-mono font-bold mt-0.5 block">
                  {modalInitiative.coordinates || 'إحداثيات جغرافية مسجلة'}
                </span>
              </div>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(modalInitiative.coordinates || modalInitiative.name)}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <span>الفتح المباشر في Google Maps 🗺️</span>
              </a>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-800 flex-wrap gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                إغلاق النافذة ❌
              </button>
              
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  if (onSelectInitiative) {
                    onSelectInitiative(modalInitiative.id);
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-6 py-2.5 rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <span>الانتقال للملف الميداني والتحقق 📁</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
