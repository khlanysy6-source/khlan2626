import React, { useEffect, useMemo, useState, useRef } from 'react';
import { 
  Route, Search, ShieldCheck, X, ChevronLeft, 
  Ruler, Users, Activity, Eye, EyeOff, Layers3, ZoomIn, ZoomOut, RotateCcw,
  Compass, MapPin, CheckCircle2, AlertTriangle, Clock, Info, ExternalLink,
  Filter, Crosshair
} from 'lucide-react';
import { Initiative } from '../types';
import { generatedInitiatives } from '../data/generated/initiatives725';
import { 
  normalizeAndAuditGISRoads, 
  GISFeatureRecord, 
  GISBounds, 
  IBB_DISTRICT_CENTERS,
  IBB_GEO_LIMITS
} from '../utils/gisRoadPipeline';

const statusMeta: Record<string, { label: string; cls: string; color: string }> = {
  completed: { label: 'منجز', cls: 'completed', color: '#10b981' },
  ongoing: { label: 'قيد التنفيذ', cls: 'ongoing', color: '#38bdf8' },
  stagnant: { label: 'متعثر', cls: 'stagnant', color: '#f59e0b' },
  stopped: { label: 'متوقف', cls: 'stopped', color: '#ef4444' },
  pending: { label: 'لم يبدأ/قيد الاعتماد', cls: 'pending', color: '#94a3b8' }
};

interface OfficialRoadNetworkProps {
  initiatives?: Initiative[];
  publicMode?: boolean;
  onSelectInitiative?: (id: string) => void;
  compactHeader?: boolean;
  selectedInitiativeId?: string | null;
}

export default function OfficialRoadNetwork({
  initiatives,
  publicMode = false,
  onSelectInitiative,
  compactHeader = false,
  selectedInitiativeId = null
}: OfficialRoadNetworkProps) {
  const [district, setDistrict] = useState('all');
  const [status, setStatus] = useState('all');
  const [geometryFilter, setGeometryFilter] = useState<'all' | 'linestring' | 'point'>('all');
  const [query, setQuery] = useState('');
  const [selectedRoad, setSelectedRoad] = useState<GISFeatureRecord | null>(null);
  const [hoveredRoad, setHoveredRoad] = useState<GISFeatureRecord | null>(null);
  
  // Layer toggles
  const [showLineStrings, setShowLineStrings] = useState(true);
  const [showSurveyTracks, setShowSurveyTracks] = useState(true);
  const [showPointPins, setShowPointPins] = useState(true);
  const [showBoundary, setShowBoundary] = useState(true);
  const [showDistricts, setShowDistricts] = useState(true);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Zoom / Viewport scale
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Data fetching
  const [surveyTracks, setSurveyTracks] = useState<any[]>([]);
  const [surveyLoading, setSurveyLoading] = useState(true);
  const [boundary, setBoundary] = useState<[number, number][]>([]);

  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/data/ibb-road-tracks.json')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (alive && d?.tracks) setSurveyTracks(d.tracks);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setSurveyLoading(false);
      });

    fetch('/data/ibb-governorate-boundary.json')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        const ring = d?.geometry?.coordinates?.[0];
        if (alive && Array.isArray(ring)) {
          setBoundary(ring as [number, number][]);
        }
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, []);

  // Source initiatives
  const sourceInitiatives = useMemo(() => {
    if (initiatives && initiatives.length > 0) return initiatives;
    return generatedInitiatives;
  }, [initiatives]);

  // Unified GIS Normalization & Audit Result
  const gisResult = useMemo(() => {
    return normalizeAndAuditGISRoads(sourceInitiatives, surveyTracks, boundary);
  }, [sourceInitiatives, surveyTracks, boundary]);

  const { features, audit, bounds } = gisResult;

  // Unique list of districts
  const districts = useMemo(() => {
    const set = new Set<string>();
    features.forEach(r => {
      if (r.district) set.add(r.district);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ar'));
  }, [features]);

  // Filtered features
  const filteredFeatures = useMemo(() => {
    return features.filter(r => {
      if (r.isExcluded) return false;
      const matchDistrict = district === 'all' || r.district === district || r.district === `مديرية ${district}`;
      const matchStatus = status === 'all' || r.status === status;
      const matchGeom = 
        geometryFilter === 'all' || 
        (geometryFilter === 'linestring' && r.geometryType === 'LineString') ||
        (geometryFilter === 'point' && r.geometryType === 'Point');
      const matchQuery = !query.trim() || `${r.name} ${r.district} ${r.subDistrict || ''} ${r.id}`.includes(query.trim());
      return matchDistrict && matchStatus && matchGeom && matchQuery;
    });
  }, [features, district, status, geometryFilter, query]);

  // Visible line strings and points
  const visibleLineStrings = useMemo(() => {
    return filteredFeatures.filter(f => f.geometryType === 'LineString');
  }, [filteredFeatures]);

  const visiblePoints = useMemo(() => {
    return filteredFeatures.filter(f => f.geometryType === 'Point');
  }, [filteredFeatures]);

  // SVG Projection Coordinates Conversion
  const SVG_WIDTH = 1000;
  const SVG_HEIGHT = 760;
  const PADDING = 20;

  const projectPoint = useMemo(() => {
    // Equirectangular projection centered on Ibb (latitude ~14°N: cos(14°) ≈ 0.9703)
    const cosLat = 0.9703;
    const midLng = (bounds.minLng + bounds.maxLng) / 2;
    const midLat = (bounds.minLat + bounds.maxLat) / 2;
    const spanLngDeg = Math.max(0.05, bounds.maxLng - bounds.minLng);
    const spanLatDeg = Math.max(0.05, bounds.maxLat - bounds.minLat);
    
    // Proportional physical extents in arbitrary units
    const spanX = spanLngDeg * cosLat;
    const spanY = spanLatDeg;
    
    const drawWidth = SVG_WIDTH - PADDING * 2;
    const drawHeight = SVG_HEIGHT - PADDING * 2;
    
    // Equal scaling factor for X and Y ensures strictly zero geometric stretching/distortion
    const scale = Math.min(drawWidth / spanX, drawHeight / spanY);

    return (lng: number, lat: number): [number, number] => {
      const dx = (lng - midLng) * cosLat;
      const dy = lat - midLat;
      const x = SVG_WIDTH / 2 + dx * scale;
      const y = SVG_HEIGHT / 2 - dy * scale; // Inverted Y-axis for SVG coordinate space
      return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
    };
  }, [bounds]);

  // Projected Boundary Polygon
  const boundaryPointsString = useMemo(() => {
    if (!boundary || boundary.length < 3) return '';
    return boundary
      .map(([lng, lat]) => {
        const [x, y] = projectPoint(lng, lat);
        return `${x},${y}`;
      })
      .join(' ');
  }, [boundary, projectPoint]);

  // Interactive mouse drag and pan controls
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...panOffset };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPanOffset({
      x: panStartRef.current.x + dx / zoomLevel,
      y: panStartRef.current.y + dy / zoomLevel
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.25 : -0.25;
    setZoomLevel(z => Math.max(0.8, Math.min(5.5, Math.round((z + delta) * 10) / 10)));
  };

  // Zoom to specific road geometry
  const handleFocusRoad = (road: GISFeatureRecord) => {
    setSelectedRoad(road);
    if (road.geometryType === 'LineString' && road.lineStrings.length > 0 && road.lineStrings[0].length > 0) {
      const pts = road.lineStrings[0];
      const midIdx = Math.floor(pts.length / 2);
      const [midLng, midLat] = pts[midIdx];
      const [cx, cy] = projectPoint(midLng, midLat);
      setZoomLevel(2.6);
      setPanOffset({
        x: (SVG_WIDTH / 2 - cx) * 0.75,
        y: (SVG_HEIGHT / 2 - cy) * 0.75
      });
    } else if (road.point) {
      const [cx, cy] = projectPoint(road.point[0], road.point[1]);
      setZoomLevel(2.8);
      setPanOffset({
        x: (SVG_WIDTH / 2 - cx) * 0.75,
        y: (SVG_HEIGHT / 2 - cy) * 0.75
      });
    }
  };

  // Zoom / Focus to specific district
  const handleDistrictSelect = (d: string) => {
    setDistrict(d);
    if (d === 'all') {
      handleResetView();
    } else {
      const center = IBB_DISTRICT_CENTERS[d] || IBB_DISTRICT_CENTERS[`مديرية ${d}`];
      if (center) {
        const [cx, cy] = projectPoint(center[0], center[1]);
        setZoomLevel(2.2);
        setPanOffset({
          x: (SVG_WIDTH / 2 - cx) * 0.7,
          y: (SVG_HEIGHT / 2 - cy) * 0.7
        });
      }
    }
  };

  // Sync external selection
  useEffect(() => {
    if (selectedInitiativeId) {
      const found = features.find(f => String(f.id) === String(selectedInitiativeId));
      if (found) {
        handleFocusRoad(found);
      }
    }
  }, [selectedInitiativeId, features]);

  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setSelectedRoad(null);
  };

  // KPIs
  const stats = useMemo(() => {
    const totalKm = filteredFeatures.reduce((sum, r) => sum + (r.completedLengthMeters / 1000), 0);
    const totalBeneficiaries = filteredFeatures.reduce((sum, r) => sum + r.beneficiaries, 0);
    const avgCompletion = filteredFeatures.length > 0
      ? Math.round(filteredFeatures.reduce((sum, r) => sum + r.completionRate, 0) / filteredFeatures.length)
      : 0;

    return {
      totalCount: filteredFeatures.length,
      lineStringCount: visibleLineStrings.length,
      pointCount: visiblePoints.length,
      totalKm,
      beneficiaries: totalBeneficiaries,
      avgCompletion
    };
  }, [filteredFeatures, visibleLineStrings, visiblePoints]);

  return (
    <section className="roadnet" aria-label="شبكة طرق محافظة إب والمسارات الميدانية">
      {/* Top Header */}
      {!compactHeader ? (
        <header className="roadnet__head">
          <div>
            <span className="roadnet__eyebrow">
              <Compass size={14} className="text-emerald-400" /> نظم المعلومات الجغرافية (GIS) · مركز البيانات الميدانية
            </span>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              الخريطة الجغرافية وشبكة الطرق الموثقة
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                {audit.recordsWithLineString} مسار KML موثق · {audit.recordsWithPointOnly} موقع مبادرة
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              تمثيل دقيق لهندسة الطرق المسجلة (LineStrings) بدون أي خطوط مستقيمة أو مسارات مصطنعة.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              type="button" 
              onClick={() => setShowAuditModal(true)}
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition"
            >
              <ShieldCheck size={15} className="text-emerald-400" />
              <span>تقرير التدقيق الجغرافي ({audit.totalRecords})</span>
            </button>
          </div>
        </header>
      ) : (
        <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-lg text-xs mb-3">
          <div className="flex items-center gap-2">
            <Compass size={15} className="text-emerald-400" />
            <span className="font-bold text-slate-200">الخريطة التشغيلية التفاعلية</span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
              {audit.recordsWithLineString} مسار موثق هندسياً
            </span>
          </div>
          <button 
            type="button" 
            onClick={() => setShowAuditModal(true)}
            className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition"
          >
            <ShieldCheck size={13} />
            <span>تقرير التدقيق ({audit.totalRecords})</span>
          </button>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="roadnet__stats">
        <div>
          <Route className="text-emerald-400" />
          <b>{stats.lineStringCount.toLocaleString('ar-YE')}</b>
          <span>مسار خطي موثق هندسياً</span>
        </div>
        <div>
          <MapPin className="text-amber-400" />
          <b>{stats.pointCount.toLocaleString('ar-YE')}</b>
          <span>موقع جغرافي (GPS)</span>
        </div>
        {!publicMode && (
          <div>
            <Ruler className="text-sky-400" />
            <b>{stats.totalKm.toLocaleString('ar-YE', { maximumFractionDigits: 1 })} كم</b>
            <span>إجمالي الأطوال المنفذة</span>
          </div>
        )}
        {!publicMode && (
          <div>
            <Users className="text-purple-400" />
            <b>{stats.beneficiaries.toLocaleString('ar-YE')}</b>
            <span>مستفيد مسجل</span>
          </div>
        )}
        <div>
          <Activity className="text-emerald-400" />
          <b>{stats.avgCompletion}%</b>
          <span>متوسط الإنجاز الفعلي</span>
        </div>
      </div>

      {/* Filter and Layer Controls */}
      <div className="roadnet__filters">
        <div className="roadnet__layerToggle">
          <button 
            type="button" 
            onClick={() => setShowLineStrings(v => !v)} 
            aria-pressed={showLineStrings}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition ${
              showLineStrings ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {showLineStrings ? <Eye size={14} /> : <EyeOff size={14} />}
            <span>شبكة الطرق ({audit.recordsWithLineString})</span>
          </button>

          <button 
            type="button" 
            onClick={() => setShowPointPins(v => !v)} 
            aria-pressed={showPointPins}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition ${
              showPointPins ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {showPointPins ? <Eye size={14} /> : <EyeOff size={14} />}
            <span>مواقع المشاريع ({audit.recordsWithPointOnly})</span>
          </button>

          <button 
            type="button" 
            onClick={() => setShowSurveyTracks(v => !v)} 
            aria-pressed={showSurveyTracks}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition ${
              showSurveyTracks ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Layers3 size={14} />
            <span>مسارات KML ({surveyTracks.length})</span>
          </button>

          <button 
            type="button" 
            onClick={() => setShowBoundary(v => !v)} 
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs transition ${
              showBoundary ? 'bg-slate-700 text-slate-200 border border-slate-600' : 'bg-slate-800 text-slate-400'
            }`}
          >
            <span>حدود إب</span>
          </button>

          <button 
            type="button" 
            onClick={() => setShowDistricts(v => !v)} 
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs transition ${
              showDistricts ? 'bg-slate-700 text-slate-200 border border-slate-600' : 'bg-slate-800 text-slate-400'
            }`}
          >
            <span>المديريات</span>
          </button>
        </div>

        {/* Search Field */}
        <label className="flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-700 flex-1 min-w-[200px]">
          <Search size={15} className="text-slate-400" />
          <input 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
            placeholder="ابحث باسم الطريق أو المديرية أو العزلة..."
            className="bg-transparent border-none outline-none text-xs text-slate-100 placeholder-slate-400 w-full"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-200">
              <X size={14} />
            </button>
          )}
        </label>

        {/* District Selector */}
        <select 
          value={district} 
          onChange={e => handleDistrictSelect(e.target.value)}
          className="bg-slate-800 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 outline-none"
        >
          <option value="all">كل المديريات ({districts.length})</option>
          {districts.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {/* Status Selector */}
        <select 
          value={status} 
          onChange={e => setStatus(e.target.value)}
          className="bg-slate-800 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 outline-none"
        >
          <option value="all">كل الحالات</option>
          {Object.entries(statusMeta).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Main Map Canvas and Sidebar */}
      <div className="roadnet__body">
        <div className="roadnet__map relative">
          {/* Diagnostic Info Header Bar on Map */}
          <div className="gis-diag-strip">
            <span>مسارات هندسية فعلية: <b>{stats.lineStringCount}</b></span>
            <span>· نقاط مشاريع: <b>{stats.pointCount}</b></span>
            <span>· مسارات KML: <b>{surveyTracks.length}</b></span>
            <span>· مستبعد للمراجعة: <b>{audit.invalidOrExcludedRecords}</b></span>
            <span>· النطاق: <b>{bounds.minLng.toFixed(2)}°E - {bounds.maxLng.toFixed(2)}°E</b></span>
          </div>

          {/* Map Zoom Controls */}
          <div className="gis-map-controls">
            <button 
              type="button" 
              onClick={() => setZoomLevel(z => Math.min(5, Math.round((z + 0.5) * 10) / 10))} 
              title="تكبير الخريطة (+)"
              aria-label="تكبير الخريطة"
              className="gis-map-btn"
            >
              <ZoomIn size={16} />
            </button>
            <button 
              type="button" 
              onClick={() => setZoomLevel(z => Math.max(0.8, Math.round((z - 0.5) * 10) / 10))} 
              title="تصغير الخريطة (-)"
              aria-label="تصغير الخريطة"
              className="gis-map-btn"
            >
              <ZoomOut size={16} />
            </button>
            <button 
              type="button" 
              onClick={handleResetView} 
              title="إعادة ضبط الرؤية لكامل المحافظة"
              aria-label="إعادة ضبط الرؤية"
              className="gis-map-btn"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          {/* Interactive SVG Canvas */}
          <svg 
            ref={svgRef}
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} 
            className="gis-canvas"
            preserveAspectRatio="xMidYMid meet"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <defs>
              <pattern id="gisGrid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="0.5" />
              </pattern>

              <radialGradient id="ibbRelief" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(16, 185, 129, 0.08)" />
                <stop offset="70%" stopColor="rgba(16, 185, 129, 0.03)" />
                <stop offset="100%" stopColor="rgba(16, 185, 129, 0.01)" />
              </radialGradient>

              <filter id="roadGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Grid */}
            <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="#080c14" />
            <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#gisGrid)" />

            {/* Zoom / Pan Container Group */}
            <g 
              transform={`translate(${500 + panOffset.x}, ${380 + panOffset.y}) scale(${zoomLevel}) translate(-500, -380)`}
              style={{
                transition: isDraggingRef.current ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {/* Layer 1: Official Ibb Governorate Boundary */}
              {showBoundary && boundaryPointsString && (
                <g className="gis-layer-boundary">
                  <polygon 
                    points={boundaryPointsString} 
                    fill="url(#ibbRelief)" 
                    stroke="rgba(16, 185, 129, 0.75)" 
                    strokeWidth="2" 
                    strokeDasharray="6 4"
                  />
                </g>
              )}

              {/* Layer 2: Raw Survey Tracks (KML Overlay) */}
              {showSurveyTracks && surveyTracks.length > 0 && (
                <g className="gis-layer-survey-tracks" opacity="0.85">
                  {surveyTracks.map((track, idx) => {
                    if (!Array.isArray(track.points) || track.points.length < 2) return null;
                    const ptsString = track.points
                      .map((p: any) => {
                        const [x, y] = projectPoint(p[0], p[1]);
                        return `${x},${y}`;
                      })
                      .join(' ');

                    return (
                      <polyline 
                        key={`survey_${track.id || idx}`}
                        points={ptsString}
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="2.4"
                        strokeDasharray="5 3"
                        strokeLinecap="round"
                        opacity="0.8"
                      >
                        <title>{`مسار مسح KML: ${track.name || track.id}`}</title>
                      </polyline>
                    );
                  })}
                </g>
              )}

              {/* Layer 3: Authentic LineString Road Geometries */}
              {showLineStrings && (
                <g className="gis-layer-roads">
                  {visibleLineStrings.map(road => {
                    const isSelected = selectedRoad?.id === road.id;
                    const isHovered = hoveredRoad?.id === road.id;
                    const color = statusMeta[road.status]?.color || '#10b981';

                    return road.lineStrings.map((segment, segIdx) => {
                      const ptsString = segment
                        .map(([lng, lat]) => {
                          const [x, y] = projectPoint(lng, lat);
                          return `${x},${y}`;
                        })
                        .join(' ');

                      return (
                        <g key={`road_${road.id}_${segIdx}`}>
                          {/* Outer dark casing for maximum contrast */}
                          <polyline 
                            points={ptsString}
                            fill="none"
                            stroke="#020617"
                            strokeWidth={isSelected ? "7" : (isHovered ? "6" : "4.8")}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.95"
                          />

                          {/* Hover/Selection glow casing */}
                          {(isSelected || isHovered) && (
                            <polyline 
                              points={ptsString}
                              fill="none"
                              stroke={color}
                              strokeWidth={isSelected ? "9" : "7"}
                              opacity="0.6"
                              filter="url(#roadGlow)"
                            />
                          )}

                          {/* Core road line */}
                          <polyline 
                            points={ptsString}
                            fill="none"
                            stroke={isSelected ? '#ffffff' : color}
                            strokeWidth={isSelected ? "4.2" : (isHovered ? "3.6" : "2.6")}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="cursor-pointer transition-all duration-150"
                            onClick={() => handleFocusRoad(road)}
                            onMouseEnter={() => setHoveredRoad(road)}
                            onMouseLeave={() => setHoveredRoad(null)}
                          >
                            <title>{`${road.name} (${road.district}) - ${road.completionRate}%`}</title>
                          </polyline>

                          {/* Start and End nodes */}
                          {segment.length > 0 && (
                            <>
                              <circle 
                                cx={projectPoint(segment[0][0], segment[0][1])[0]} 
                                cy={projectPoint(segment[0][0], segment[0][1])[1]} 
                                r={isSelected ? "5" : "3"} 
                                fill="#10b981" 
                                stroke="#020617"
                                strokeWidth="1"
                              />
                              <circle 
                                cx={projectPoint(segment[segment.length - 1][0], segment[segment.length - 1][1])[0]} 
                                cy={projectPoint(segment[segment.length - 1][0], segment[segment.length - 1][1])[1]} 
                                r={isSelected ? "5" : "3"} 
                                fill="#f43f5e" 
                                stroke="#020617"
                                strokeWidth="1"
                              />
                            </>
                          )}
                        </g>
                      );
                    });
                  })}
                </g>
              )}

              {/* Layer 4: Discrete Point Project Pins (Point-only records) */}
              {showPointPins && (
                <g className="gis-layer-points">
                  {visiblePoints.map(pointRoad => {
                    if (!pointRoad.point) return null;
                    const [x, y] = projectPoint(pointRoad.point[0], pointRoad.point[1]);
                    const isSelected = selectedRoad?.id === pointRoad.id;
                    const isHovered = hoveredRoad?.id === pointRoad.id;
                    const color = statusMeta[pointRoad.status]?.color || '#f59e0b';

                    return (
                      <g 
                        key={`pt_${pointRoad.id}`}
                        className="cursor-pointer"
                        onClick={() => handleFocusRoad(pointRoad)}
                        onMouseEnter={() => setHoveredRoad(pointRoad)}
                        onMouseLeave={() => setHoveredRoad(null)}
                      >
                        {isSelected && (
                          <circle cx={x} cy={y} r="14" fill={color} opacity="0.3" className="animate-ping" />
                        )}
                        <circle 
                          cx={x} 
                          cy={y} 
                          r={isSelected ? "6.5" : (isHovered ? "5" : "3")} 
                          fill={color} 
                          stroke="#020617" 
                          strokeWidth={isSelected ? "2" : (isHovered ? "1.5" : "1")}
                          opacity={isSelected || isHovered ? "1" : "0.8"}
                        >
                          <title>{`${pointRoad.name} (${pointRoad.district}) - ${pointRoad.completionRate}%`}</title>
                        </circle>
                      </g>
                    );
                  })}
                </g>
              )}

              {/* Layer 5: District Center Markers */}
              {showDistricts && (
                <g className="gis-layer-districts">
                  {Object.entries(IBB_DISTRICT_CENTERS).map(([name, [lng, lat]]) => {
                    const [x, y] = projectPoint(lng, lat);
                    const isSelectedDistrict = district === name || district === name.replace('مديرية ', '');
                    return (
                      <g 
                        key={name} 
                        transform={`translate(${x}, ${y})`}
                        className="cursor-pointer transition-transform duration-150 hover:scale-125"
                        onClick={() => handleDistrictSelect(name)}
                      >
                        <circle 
                          r={isSelectedDistrict ? "5" : "3.5"} 
                          fill={isSelectedDistrict ? "#10b981" : "#38bdf8"} 
                          stroke="#020617" 
                          strokeWidth="1.5" 
                          opacity="0.9" 
                        />
                        <text 
                          y="-7" 
                          textAnchor="middle" 
                          fill={isSelectedDistrict ? "#a7f3d0" : "#f8fafc"} 
                          stroke="#020617"
                          strokeWidth="3"
                          paintOrder="stroke fill"
                          fontSize="10" 
                          fontWeight="800"
                          className="gis-district-label select-none"
                        >
                          {name.replace('مديرية ', '')}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}
            </g>
          </svg>

          {/* Hover Road Floating Pill */}
          {hoveredRoad && !selectedRoad && (
            <div className="gis-hover-card">
              <div className="font-bold text-slate-100">{hoveredRoad.name}</div>
              <div className="text-xs text-slate-300">{hoveredRoad.district} {hoveredRoad.subDistrict ? `· ${hoveredRoad.subDistrict}` : ''}</div>
              <div className="text-[11px] text-emerald-400 mt-1 flex items-center justify-between">
                <span>{hoveredRoad.trustLabel}</span>
                <span>{hoveredRoad.completionRate}% إنجاز</span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Road Records and Inspector */}
        <div className="roadnet__sidebar">
          {selectedRoad ? (
            <div className="gis-inspector-card">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full bg-[${statusMeta[selectedRoad.status]?.color}]`} />
                  <span className="text-xs font-bold text-slate-300">{statusMeta[selectedRoad.status]?.label}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setSelectedRoad(null)} 
                  className="text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <h3 className="text-base font-bold text-slate-100 mb-1">{selectedRoad.name}</h3>
              <p className="text-xs text-slate-400 mb-4">{selectedRoad.district} · {selectedRoad.subDistrict || 'النطاق العام'}</p>

              {/* Trust Badge */}
              <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 mb-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400">درجة الثقة بالبيانات:</span>
                  <span className="font-bold text-emerald-400">{selectedRoad.trustLabel}</span>
                </div>
                <div className="text-[11px] text-slate-400">{selectedRoad.sourceDescription}</div>
              </div>

              {/* Metric Grid */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">نسبة الإنجاز</span>
                  <b className="text-sm text-emerald-400">{selectedRoad.completionRate}%</b>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">الطول المنفذ</span>
                  <b className="text-sm text-slate-100">{(selectedRoad.completedLengthMeters / 1000).toFixed(2)} كم</b>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">متوسط العرض</span>
                  <b className="text-sm text-slate-100">{selectedRoad.avgWidthMeters} م</b>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">المستفيدين</span>
                  <b className="text-sm text-slate-100">{selectedRoad.beneficiaries.toLocaleString('ar-YE')}</b>
                </div>
              </div>

              {/* Coordinates Verification Block */}
              <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-800 text-xs mb-4">
                <span className="font-bold text-slate-300 block mb-2">الإحداثيات والتحقق الهندسي:</span>
                {selectedRoad.startPoint && (
                  <div className="text-[11px] text-slate-400 font-mono mb-1">
                    البداية: {selectedRoad.startPoint[1].toFixed(6)}°N, {selectedRoad.startPoint[0].toFixed(6)}°E
                  </div>
                )}
                {selectedRoad.endPoint && (
                  <div className="text-[11px] text-slate-400 font-mono mb-1">
                    النهاية: {selectedRoad.endPoint[1].toFixed(6)}°N, {selectedRoad.endPoint[0].toFixed(6)}°E
                  </div>
                )}
                {selectedRoad.endpointVerification && (
                  <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-cyan-400">
                    {selectedRoad.endpointVerification.diagnosticNote}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 mt-auto">
                {onSelectInitiative && (
                  <button 
                    type="button" 
                    onClick={() => onSelectInitiative(selectedRoad.id)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition"
                  >
                    <span>فتح بطاقة المبادرة الكاملة</span>
                    <ExternalLink size={14} />
                  </button>
                )}
                <button 
                  type="button" 
                  onClick={handleResetView} 
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition"
                >
                  إعادة ضبط الخريطة
                </button>
              </div>
            </div>
          ) : (
            <div className="gis-list-container">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 text-xs text-slate-400">
                <span>سجلات الطرق والمبادرات ({filteredFeatures.length})</span>
                <span className="text-[11px]">اختر طريقاً للتركيز</span>
              </div>
              <div className="gis-records-list">
                {filteredFeatures.slice(0, 80).map(road => (
                  <button 
                    key={road.id} 
                    type="button" 
                    onClick={() => handleFocusRoad(road)}
                    className="gis-record-item text-right w-full p-2.5 border-b border-slate-800/60 hover:bg-slate-800/80 transition flex items-center justify-between"
                  >
                    <div>
                      <b className="text-xs text-slate-200 block">{road.name}</b>
                      <span className="text-[11px] text-slate-400">{road.district} · {road.trustLabel}</span>
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-bold text-emerald-400">{road.completionRate}%</span>
                      <span className="text-[10px] text-slate-500 block">{(road.completedLengthMeters / 1000).toFixed(1)} كم</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Audit & Diagnostic Transparency Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-emerald-400" />
                <h3 className="text-lg font-bold text-slate-100">تقرير التدقيق والتحقق الجغرافي (GIS Audit)</h3>
              </div>
              <button onClick={() => setShowAuditModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 text-xs">
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                <span className="text-slate-400 block mb-1">إجمالي السجلات الواردة:</span>
                <b className="text-base text-slate-100">{audit.totalRecords}</b>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                <span className="text-slate-400 block mb-1">مسارات LineString الحقيقية:</span>
                <b className="text-base text-emerald-400">{audit.recordsWithLineString}</b>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                <span className="text-slate-400 block mb-1">مواقع مشاريع GPS نقطية:</span>
                <b className="text-base text-amber-400">{audit.recordsWithPointOnly}</b>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                <span className="text-slate-400 block mb-1">مسارات مسح KML المحملة:</span>
                <b className="text-base text-cyan-400">{audit.surveyTracksLoaded}</b>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                <span className="text-slate-400 block mb-1">مطابقات مؤكدة هندسياً:</span>
                <b className="text-base text-emerald-300">{audit.confirmedTrackMatches}</b>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                <span className="text-slate-400 block mb-1">سجلات مستبعدة للمراجعة:</span>
                <b className="text-base text-rose-400">{audit.invalidOrExcludedRecords}</b>
              </div>
            </div>

            {audit.excludedDetails.length > 0 && (
              <div className="bg-rose-950/30 border border-rose-800/50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-bold text-rose-300 flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} />
                  سجل الاستبعاد والمراجعة الهندسية:
                </h4>
                <div className="space-y-2 text-xs">
                  {audit.excludedDetails.map(ex => (
                    <div key={ex.id} className="bg-slate-900/80 p-2.5 rounded border border-rose-900/40">
                      <div className="font-bold text-slate-200">{ex.name} ({ex.district})</div>
                      <div className="text-rose-400 text-[11px] mt-1">{ex.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-slate-400 space-y-2 border-t border-slate-800 pt-4">
              <p>✓ تم الالتزام التام بالهندسة الفعلية القادمة من مصادر KML/GeoJSON الأصلية دون أي خطوط مستقيمة مصطنعة.</p>
              <p>✓ يتم عرض السجلات النقطية فقط كمواقع مبادرات مستقلة عند تفعيل طبقة المشاريع دون اختلاق مسارات وهمية.</p>
              <p>✓ يتم تسجيل أسباب الاستبعاد بصورة شفافة دون المساس بالبيانات الأصلية.</p>
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
