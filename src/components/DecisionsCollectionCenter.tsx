import React, { useState, useMemo } from 'react';
import {
  Scale,
  FileCheck2,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  PlusCircle,
  Filter,
  Search,
  Building2,
  UserCheck,
  Zap,
  MapPin,
  ExternalLink,
  ChevronLeft,
  X,
  FileText,
  AlertTriangle
} from 'lucide-react';
import {
  getStoredDecisions,
  saveDecisions,
  addDecision,
  DecisionRecord,
  DecisionType,
  DecisionExecutionStatus
} from '../data/decisionsStore';
import { Initiative } from '../types';
import { DecisionValidationGuard } from '../intelligence/DecisionValidationGuard';
import { getAllStoredOfficials, OfficialProfile } from '../data/officialsRegistry';

interface DecisionsCollectionCenterProps {
  initiatives?: Initiative[];
  onSelectInitiative?: (initiative: Initiative) => void;
  userRole?: string;
}

export default function DecisionsCollectionCenter({
  initiatives = [],
  onSelectInitiative,
  userRole = 'visitor'
}: DecisionsCollectionCenterProps) {
  const [decisions, setDecisions] = useState<DecisionRecord[]>(() => getStoredDecisions());
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<DecisionType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDecisionModal, setSelectedDecisionModal] = useState<DecisionRecord | null>(null);
  
  // New decision creation form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newInitiativeId, setNewInitiativeId] = useState('');
  const [newType, setNewType] = useState<DecisionType>('proposed');
  const [newProblem, setNewProblem] = useState('');
  const [newEvidence, setNewEvidence] = useState('');
  const [newRecommendation, setNewRecommendation] = useState('');
  const [newOwner, setNewOwner] = useState('وحدة التدخلات المركزية');
  const [newApprovedBy, setNewApprovedBy] = useState('الدكتور محمد حسن المداني - رئيس الوحدة');
  const [selectedOfficialId, setSelectedOfficialId] = useState('');
  const [formValidationError, setFormValidationError] = useState<string | null>(null);

  const storedOfficials = useMemo(() => getAllStoredOfficials(), []);

  // Filtered decisions list
  const filteredDecisions = useMemo(() => {
    return decisions.filter(d => {
      const matchesType = selectedTypeFilter === 'all' || d.type === selectedTypeFilter;
      const matchesQuery =
        !searchQuery.trim() ||
        d.title.includes(searchQuery) ||
        d.decisionNumber.includes(searchQuery) ||
        d.district.includes(searchQuery) ||
        d.initiativeName?.includes(searchQuery);
      return matchesType && matchesQuery;
    });
  }, [decisions, selectedTypeFilter, searchQuery]);

  // Counts for each category
  const counts = useMemo(() => {
    return {
      all: decisions.length,
      proposed: decisions.filter(d => d.type === 'proposed').length,
      completed: decisions.filter(d => d.type === 'completed').length,
      transfer: decisions.filter(d => d.type === 'transfer').length,
      closing: decisions.filter(d => d.type === 'closing').length,
      stagnation_treatment: decisions.filter(d => d.type === 'stagnation_treatment').length
    };
  }, [decisions]);

  const handleUpdateStatus = (decisionId: string, newStatus: DecisionExecutionStatus) => {
    const updated = decisions.map(d => {
      if (d.id === decisionId) {
        return {
          ...d,
          executionStatus: newStatus,
          status: newStatus === 'executed' ? ('executed' as const) : d.status,
          updatedAt: new Date().toISOString()
        };
      }
      return d;
    });
    setDecisions(updated);
    saveDecisions(updated);
    if (selectedDecisionModal?.id === decisionId) {
      setSelectedDecisionModal(prev => prev ? { ...prev, executionStatus: newStatus } : null);
    }
  };

  const handleCreateDecision = (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationError(null);

    if (!newTitle.trim()) {
      setFormValidationError('عنوان القرار مطلوب.');
      return;
    }

    if (!newInitiativeId) {
      setFormValidationError('يرجى اختيار المبادرة المعنية من قائمة الـ 725 مبادرة المعتمدة.');
      return;
    }

    const matchedInit = initiatives.find(i => i.id === newInitiativeId || String(i.initiativeNumber) === newInitiativeId);
    if (!matchedInit) {
      setFormValidationError('المبادرة المحددة غير موجودة في المصدر المرجعي المعتمد.');
      return;
    }

    const official = storedOfficials.find(o => o.id === selectedOfficialId);

    // Validate using DecisionValidationGuard
    const validation = DecisionValidationGuard.validateDecision({
      initiativeId: matchedInit.id,
      initiativeName: matchedInit.name,
      district: matchedInit.district,
      currentStatus: matchedInit.status,
      completionPercentage: matchedInit.completionRate,
      decisionReason: newProblem,
      requiredAction: newRecommendation,
      responsibleEntity: newOwner,
      decisionStatus: 'approved',
      responsibleOfficialId: official?.id,
      responsibleOfficialName: official?.fullName,
      responsibleOfficialPhone: official?.phone
    });

    if (!validation.isValid) {
      setFormValidationError(validation.errors.join(' | '));
      return;
    }

    const approverName = official ? `${official.fullName} (${official.jobTitle})` : newApprovedBy;

    const created = addDecision({
      decisionNumber: `DEC-2026-${100 + (Date.now() % 900)}`,
      title: newTitle.trim(),
      initiativeId: matchedInit.id,
      initiativeName: matchedInit.name,
      district: matchedInit.district,
      type: newType,
      status: 'approved',
      problem: newProblem || 'رصد فجوة تنفيذية بالميدان تتطلب قراراً قيادياً فورياً.',
      evidence: newEvidence || 'محضر المعاينة الميدانية ورصد مهندس الإشراف الفني.',
      recommendation: newRecommendation || 'الموافقة على تنفيذه فوراً وإلزام الجمعية والفرسان بالالتزام.',
      owner: newOwner,
      approvedBy: approverName,
      executionStatus: 'in_execution'
    });

    setDecisions(getStoredDecisions());
    setShowCreateModal(false);
    setNewTitle('');
    setNewInitiativeId('');
    setNewProblem('');
    setNewEvidence('');
    setNewRecommendation('');
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans dir-rtl text-right">
      
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-indigo-800 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-300 text-[11px] font-black px-3 py-1 rounded-full border border-indigo-500/30">
                سجل القرارات المؤسسية الرسمية (Collection: decisions)
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-bold px-2.5 py-1 rounded-full">
                ربط مباشر بحسابات القيادة
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Scale className="w-6 h-6 text-amber-400" />
              مركز القرارات والتوجيهات القيادية المعتمدة بمحافظة إب
            </h2>
            <p className="text-xs text-indigo-200/90 leading-relaxed max-w-3xl font-medium">
              تصفح وتتبع كافة القرارات الصادرة عن قيادة المحافظة ووحدة التدخلات المركزية (قرارات مقترحة، منجزة، مناقلات، معالجة التعثر، وإغلاق المبادرات).
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-2xl shadow-lg border border-amber-300 transition-all cursor-pointer flex items-center gap-2 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>صياغة وإصدار قرار جديد</span>
          </button>
        </div>

        {/* INTERACTIVE DECISION CARDS CATEGORIES (5 CARDS) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 border-t border-slate-800/80">
          
          {/* ALL */}
          <button
            onClick={() => setSelectedTypeFilter('all')}
            className={`p-3.5 rounded-2xl text-right transition-all cursor-pointer border flex flex-col justify-between space-y-1 ${
              selectedTypeFilter === 'all'
                ? 'bg-slate-800 border-amber-400 shadow-md ring-1 ring-amber-400/40'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span className="text-[10px] font-bold text-slate-400 block">كافة القرارات</span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-white">الكل</span>
              <span className="bg-slate-700 text-white font-mono font-black text-xs px-2 py-0.5 rounded-full">
                {counts.all}
              </span>
            </div>
          </button>

          {/* PROPOSED */}
          <button
            onClick={() => setSelectedTypeFilter('proposed')}
            className={`p-3.5 rounded-2xl text-right transition-all cursor-pointer border flex flex-col justify-between space-y-1 ${
              selectedTypeFilter === 'proposed'
                ? 'bg-amber-950/90 border-amber-400 shadow-md ring-1 ring-amber-400/40'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span className="text-[10px] font-bold text-amber-300 block">💡 قرارات مقترحة</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-200">مقترحة</span>
              <span className="bg-amber-500/30 text-amber-200 font-mono font-black text-xs px-2 py-0.5 rounded-full border border-amber-500/40">
                {counts.proposed}
              </span>
            </div>
          </button>

          {/* COMPLETED */}
          <button
            onClick={() => setSelectedTypeFilter('completed')}
            className={`p-3.5 rounded-2xl text-right transition-all cursor-pointer border flex flex-col justify-between space-y-1 ${
              selectedTypeFilter === 'completed'
                ? 'bg-emerald-950/90 border-emerald-400 shadow-md ring-1 ring-emerald-400/40'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span className="text-[10px] font-bold text-emerald-300 block">✅ قرارات منجزة</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-200">منجزة</span>
              <span className="bg-emerald-500/30 text-emerald-200 font-mono font-black text-xs px-2 py-0.5 rounded-full border border-emerald-500/40">
                {counts.completed}
              </span>
            </div>
          </button>

          {/* TRANSFER */}
          <button
            onClick={() => setSelectedTypeFilter('transfer')}
            className={`p-3.5 rounded-2xl text-right transition-all cursor-pointer border flex flex-col justify-between space-y-1 ${
              selectedTypeFilter === 'transfer'
                ? 'bg-blue-950/90 border-blue-400 shadow-md ring-1 ring-blue-400/40'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span className="text-[10px] font-bold text-blue-300 block">📦 قرارات مناقلة</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-blue-200">مناقلة</span>
              <span className="bg-blue-500/30 text-blue-200 font-mono font-black text-xs px-2 py-0.5 rounded-full border border-blue-500/40">
                {counts.transfer}
              </span>
            </div>
          </button>

          {/* STAGNATION TREATMENT */}
          <button
            onClick={() => setSelectedTypeFilter('stagnation_treatment')}
            className={`p-3.5 rounded-2xl text-right transition-all cursor-pointer border flex flex-col justify-between space-y-1 ${
              selectedTypeFilter === 'stagnation_treatment'
                ? 'bg-rose-950/90 border-rose-400 shadow-md ring-1 ring-rose-400/40'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span className="text-[10px] font-bold text-rose-300 block">🚨 معالجة التعثر</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-rose-200">حاسمة</span>
              <span className="bg-rose-500/30 text-rose-200 font-mono font-black text-xs px-2 py-0.5 rounded-full border border-rose-500/40">
                {counts.stagnation_treatment}
              </span>
            </div>
          </button>

          {/* CLOSING */}
          <button
            onClick={() => setSelectedTypeFilter('closing')}
            className={`p-3.5 rounded-2xl text-right transition-all cursor-pointer border flex flex-col justify-between space-y-1 ${
              selectedTypeFilter === 'closing'
                ? 'bg-teal-950/90 border-teal-400 shadow-md ring-1 ring-teal-400/40'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span className="text-[10px] font-bold text-teal-300 block">🏁 قرارات إغلاق</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-teal-200">إغلاق وتوثيق</span>
              <span className="bg-teal-500/30 text-teal-200 font-mono font-black text-xs px-2 py-0.5 rounded-full border border-teal-500/40">
                {counts.closing}
              </span>
            </div>
          </button>

        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في رقم القرار، العنوان، المبادرة، أو المديرية..."
            className="w-full pr-10 pl-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-400 transition-all"
          />
        </div>

        <div className="text-xs text-slate-400 font-bold flex items-center gap-2">
          <span>عدد القرارات المعروضة:</span>
          <span className="font-mono text-emerald-400 font-black text-sm">{filteredDecisions.length} قرار</span>
        </div>
      </div>

      {/* DECISION ITEMS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDecisions.map(dec => {
          const matchedInit = initiatives.find(i => i.id === dec.initiativeId || i.initiativeNumber === dec.initiativeId);
          return (
            <div
              key={dec.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs text-amber-400 bg-amber-950 px-2 py-0.5 rounded-md border border-amber-800">
                        {dec.decisionNumber}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        dec.type === 'proposed' ? 'bg-amber-900/60 text-amber-300' :
                        dec.type === 'completed' ? 'bg-emerald-900/60 text-emerald-300' :
                        dec.type === 'transfer' ? 'bg-blue-900/60 text-blue-300' :
                        dec.type === 'stagnation_treatment' ? 'bg-rose-900/60 text-rose-300' :
                        'bg-teal-900/60 text-teal-300'
                      }`}>
                        {dec.type === 'proposed' ? 'قرار مقترح' :
                         dec.type === 'completed' ? 'قرار منجز' :
                         dec.type === 'transfer' ? 'قرار مناقلة' :
                         dec.type === 'stagnation_treatment' ? 'معالجة تعثر' : 'إغلاق وتوثيق'}
                      </span>
                    </div>
                    <h3 className="font-black text-sm text-white leading-snug">
                      {dec.title}
                    </h3>
                  </div>

                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0 border ${
                    dec.executionStatus === 'executed' ? 'bg-emerald-950 text-emerald-300 border-emerald-700' :
                    dec.executionStatus === 'in_execution' ? 'bg-blue-950 text-blue-300 border-blue-700' :
                    'bg-amber-950 text-amber-300 border-amber-700'
                  }`}>
                    {dec.executionStatus === 'executed' ? 'منفذ بالكامل 🟢' :
                     dec.executionStatus === 'in_execution' ? 'قيد التنفيذ 🔵' : 'معتمد وفي الانتظار 🟡'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300 font-bold">
                    <span className="text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      المبادرة والمديرية:
                    </span>
                    <span className="text-white truncate max-w-[220px]">{dec.initiativeName}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] space-y-1">
                    <span className="text-slate-400 font-bold block">التوصية والقرار الصادر:</span>
                    <p className="text-slate-200 font-medium line-clamp-2">{dec.recommendation}</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="text-[10px] text-slate-400 font-medium">
                  المعتمد: <strong className="text-emerald-400">{dec.approvedBy}</strong>
                </div>

                <div className="flex items-center gap-2">
                  {matchedInit && onSelectInitiative && (
                    <button
                      onClick={() => onSelectInitiative(matchedInit)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>المبادرة</span>
                      <ExternalLink className="w-3 h-3 text-sky-400" />
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedDecisionModal(dec)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <span>التفاصيل والإجراء ⚖️</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DETAIL DECISION MODAL */}
      {selectedDecisionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative text-right dir-rtl">
            
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs text-amber-400 bg-amber-950 px-2.5 py-0.5 rounded-md border border-amber-800">
                    {selectedDecisionModal.decisionNumber}
                  </span>
                  <span className="bg-indigo-950 text-indigo-300 font-bold text-[10px] px-2 py-0.5 rounded-full border border-indigo-800">
                    وثيقة قرار رسمي معتمدة
                  </span>
                </div>
                <h3 className="text-lg font-black text-white leading-snug">
                  {selectedDecisionModal.title}
                </h3>
              </div>

              <button
                onClick={() => setSelectedDecisionModal(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">المبادرة المرتبطة:</span>
                  <span className="font-black text-white">{selectedDecisionModal.initiativeName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">المديرية والمسؤولية:</span>
                  <span className="font-black text-amber-300">{selectedDecisionModal.district}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">الجهة الصادر عنها:</span>
                  <span className="font-black text-emerald-300">{selectedDecisionModal.owner}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">شخصية الاعتماد القيادي:</span>
                  <span className="font-black text-sky-300">{selectedDecisionModal.approvedBy}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  المشكلة المرصودة بالميدان:
                </span>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 leading-relaxed font-medium">
                  {selectedDecisionModal.problem}
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-sky-400 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  الشواهد والأدلة الميدانية:
                </span>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 leading-relaxed font-medium">
                  {selectedDecisionModal.evidence}
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  التوصية والقرار الصادر:
                </span>
                <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-800/60 text-emerald-200 leading-relaxed font-bold">
                  {selectedDecisionModal.recommendation}
                </div>
              </div>

              {/* STATUS CHANGE CONTROL */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="font-bold text-white block">تحديث حالة التنفيذ الميداني للقرار:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedDecisionModal.id, 'pending')}
                    className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer border transition-all ${
                      selectedDecisionModal.executionStatus === 'pending'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    في الانتظار 🟡
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(selectedDecisionModal.id, 'in_execution')}
                    className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer border transition-all ${
                      selectedDecisionModal.executionStatus === 'in_execution'
                        ? 'bg-blue-600 text-white border-blue-400 shadow'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    قيد التنفيذ الميداني 🔵
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(selectedDecisionModal.id, 'executed')}
                    className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer border transition-all ${
                      selectedDecisionModal.executionStatus === 'executed'
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    تم التنفيذ بالكامل ✅
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedDecisionModal(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-all"
              >
                إغلاق النافذة
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CREATE NEW DECISION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative text-right dir-rtl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-amber-400" />
                صياغة وثيقة قرار قيادي جديد
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDecision} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">عنوان القرار القيادي:</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: إصدار قرار مناقلة مواد إسمنت وإعادة توجيهها لساحة الرصف الجارية"
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 block">نوع القرار:</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as DecisionType)}
                    className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-amber-400"
                  >
                    <option value="proposed">💡 قرار مقترح</option>
                    <option value="completed">✅ قرار منجز</option>
                    <option value="transfer">📦 قرار مناقلة</option>
                    <option value="stagnation_treatment">🚨 معالجة تعثر</option>
                    <option value="closing">🏁 إغلاق وتوثيق</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 block">المبادرة المعنية من قائمة الـ 725 مبادرة:</label>
                  <select
                    value={newInitiativeId}
                    onChange={(e) => setNewInitiativeId(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-amber-400"
                  >
                    <option value="">-- اختر مبادرة من قائمة الـ 725 --</option>
                    {initiatives.map(i => (
                      <option key={i.id} value={i.id}>
                        [{i.initiativeNumber || i.id}] {i.name} ({i.district} - {i.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Responsible Official Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>المسؤول المكلّف (من السجل الرسمي المعتمد):</span>
                </label>
                <select
                  value={selectedOfficialId}
                  onChange={(e) => setSelectedOfficialId(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-amber-400"
                >
                  <option value="">(تحديد تلقائي وفق المديرية)</option>
                  {storedOfficials.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.fullName} ({o.jobTitle} - {o.district})
                    </option>
                  ))}
                </select>
              </div>

              {formValidationError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{formValidationError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">المشكلة المرصودة بالميدان:</label>
                <textarea
                  rows={2}
                  value={newProblem}
                  onChange={(e) => setNewProblem(e.target.value)}
                  placeholder="اشرح المشكلة أو التعثر باختصار..."
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">التوصية والقرار التنفيذي:</label>
                <textarea
                  rows={2}
                  value={newRecommendation}
                  onChange={(e) => setNewRecommendation(e.target.value)}
                  placeholder="أدخل الإجراء الملزم المطلوب اتخاذه..."
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer shadow"
                >
                  اعتماد وحفظ القرار ⚖️
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
