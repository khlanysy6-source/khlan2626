/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import ExecutiveInitiativeCard from './ExecutiveInitiativeCard';
import { MaterialsPositionCard } from './MaterialsPositionCard';
import AIDevelopmentAdvisorCard from './AIDevelopmentAdvisorCard';
import SmartInitiativeCard from './SmartInitiativeCard';
import { Initiative, Pathway, Task, Contribution, Material, CommitteeMember, FieldReport, UserRole, hasPermission, InitiativeLifecycleStage, InitiativeDecisionCategory, InitiativeEvaluation, ExecutiveDecisionData, MonitoringLogEntry } from '../types';
import {
  ChevronLeft,
  Search,
  Users,
  Truck,
  Megaphone,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  FileCheck,
  Coins,
  ShieldAlert,
  AlertTriangle,
  Building,
  UserPlus,
  Send,
  Copy,
  Check,
  RotateCcw,
  Camera,
  ExternalLink,
  Pencil,
  TrendingUp,
  Info,
  Milestone,
  Sparkles,
  Activity,
  MapPin
} from 'lucide-react';
import { getImpactMetrics } from '../utils/impact';
import { parseNum } from '../utils/numberAndDistrictUtils';
import { ExecutiveDecisionModal, ExecutiveActionType } from './ExecutiveDecisionModal';

// Import media & campaign visual assets
import imgSurvey from '../assets/images/track1_survey_1784421279240.jpg';
import imgVolunteers from '../assets/images/track2_volunteers_1784421387279.jpg';
import imgWarehouse from '../assets/images/track3_warehouse_1784421399242.jpg';
import imgMedia from '../assets/images/track4_media_1784421409733.jpg';
import imgQuality from '../assets/images/track5_quality_1784421420419.jpg';

interface InitiativeDetailProps {
  initiative: Initiative;
  onBack: () => void;
  onUpdate: (updatedInitiative: Initiative) => void;
  role?: UserRole | 'admin' | 'visitor';
  onNavigateTab?: (tab: any, initiativeId?: string | null, pathwayId?: number) => void;
  initialPathwayId?: number;
}

interface MaterialItemProps {
  key?: string;
  material: Material;
  role: UserRole | 'admin' | 'visitor';
  handleTransferMaterial: (materialId: string, targetLocation: string) => void;
}

function MaterialItem({ material, role, handleTransferMaterial }: MaterialItemProps) {
  const [transferLoc, setTransferLoc] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  return (
    <div
      className={`p-4 border rounded-xl space-y-3 transition-all ${
        material.status === 'at_risk'
          ? 'bg-rose-50/50 border-rose-200 shadow-xs'
          : 'bg-slate-50/50 border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
            {material.name}
            <span className="text-slate-500">({material.quantity} {material.unit})</span>
          </h4>
          <p className="text-[11px] text-slate-500">
            📍 موقع التخزين: <span className="font-bold text-slate-700">{material.storageLocation}</span>
          </p>
          <span className="text-[9px] text-slate-400 block">آخر تحديث ميداني: {material.updatedAt}</span>
        </div>

        <div>
          {material.status === 'at_risk' ? (
            <span className="inline-flex items-center gap-1 text-[9px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-200 animate-pulse">
              <ShieldAlert className="w-3 h-3" />
              خطر تلف مرتفع
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" />
              مخزن بشكل آمن
            </span>
          )}
        </div>
      </div>

      {material.notes && (
        <p className="text-[10px] text-emerald-800 bg-emerald-50 p-2 rounded-lg italic">
          💡 ملحوظة: {material.notes}
        </p>
      )}

      {/* Manual Transfer action to fulfill Path 3 */}
      {(hasPermission(role, 'canApproveTransfers') || hasPermission(role, 'canAllocateSupport')) && (
        <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
          {!isTransferring ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-500 font-semibold">تأمين النقل الفوري وتغيير الموقع:</span>
              <button
                onClick={() => setIsTransferring(true)}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 hover:text-white bg-amber-50 hover:bg-amber-600 border border-amber-200 px-3 py-1 rounded transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                بدء مناقلة وإعادة توجيه
              </button>
            </div>
          ) : (
            <div className="space-y-2 bg-white border border-slate-200 rounded-lg p-2.5">
              <label className="block text-[10px] font-bold text-slate-600">الموقع الآمن الجديد لتفريغ المواد:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="مثال: مستودع التل العلوي المحمي"
                  value={transferLoc}
                  onChange={(e) => setTransferLoc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    handleTransferMaterial(material.id, transferLoc);
                    setIsTransferring(false);
                    setTransferLoc('');
                  }}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded shrink-0 cursor-pointer"
                >
                  ترحيل وتأمين
                </button>
                <button
                  type="button"
                  onClick={() => setIsTransferring(false)}
                  className="px-2 py-1 bg-slate-100 text-slate-500 font-bold text-xs rounded shrink-0"
                >
                  إلغاء
                </button>
              </div>
              <span className="text-[9px] text-slate-400 block">
                * تأكيد النقل سيقوم تلقائياً بتفعيل مهام وسائل النقل بجدول المسار الثالث.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function InitiativeDetail({
  initiative,
  onBack,
  onUpdate,
  role = 'admin',
  onNavigateTab,
  initialPathwayId
}: InitiativeDetailProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'executive_decision' | 'monitoring_timeline' | 'pathways' | 'contributions' | 'materials' | 'media' | 'reports' | 'committee'>('executive_decision');
  const [selectedPathwayId, setSelectedPathwayId] = useState<number>(initialPathwayId || 1);

  // Executive Decision Modal State
  const [activeDecisionModal, setActiveDecisionModal] = useState<boolean>(false);
  const [activeActionType, setActiveActionType] = useState<ExecutiveActionType>('direct');

  // Success copy feedback
  const [copiedText, setCopiedText] = useState(false);

  // Executive Decision & Evaluation Editing State
  const [isEditingDecision, setIsEditingDecision] = useState(false);
  const [editLifecycleStage, setEditLifecycleStage] = useState<InitiativeLifecycleStage>(initiative.lifecycleStage || 'approved');
  const [editDecisionCategory, setEditDecisionCategory] = useState<InitiativeDecisionCategory>(initiative.decisionCategory || 'ongoing_needs_monitoring');
  const [editReadinessLevel, setEditReadinessLevel] = useState<'high' | 'medium' | 'low' | 'not_ready'>(initiative.evaluation?.readinessLevel || 'high');
  const [editRequiredAction, setEditRequiredAction] = useState(initiative.executiveDecision?.requiredAction || '');
  const [editInterventionPriority, setEditInterventionPriority] = useState<'urgent' | 'medium' | 'routine'>(initiative.executiveDecision?.interventionPriority || 'routine');
  const [editResponsibleEntity, setEditResponsibleEntity] = useState(initiative.executiveDecision?.responsibleEntity || '');
  const [editNextFollowUpDate, setEditNextFollowUpDate] = useState(initiative.executiveDecision?.nextFollowUpDate || '');
  const [editDelayReasonsText, setEditDelayReasonsText] = useState((initiative.evaluation?.delayReasons || []).join('\n'));
  const [editObstaclesText, setEditObstaclesText] = useState((initiative.evaluation?.obstacles || []).join('\n'));
  const [editRequiredNeedsText, setEditRequiredNeedsText] = useState((initiative.evaluation?.requiredNeeds || []).join('\n'));

  // New Periodic Monitoring Log State
  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [newLogStatus, setNewLogStatus] = useState('قيد التنفيذ النشط');
  const [newLogAction, setNewLogAction] = useState('');
  const [newLogResponsible, setNewLogResponsible] = useState('المشرف الهندسي واللجنة الميدانية');
  const [newLogProgress, setNewLogProgress] = useState(initiative.completionRate || 0);
  const [newLogNotes, setNewLogNotes] = useState('');

  const handleStartEditDecision = () => {
    setEditLifecycleStage(initiative.lifecycleStage || 'approved');
    setEditDecisionCategory(initiative.decisionCategory || 'ongoing_needs_monitoring');
    setEditReadinessLevel(initiative.evaluation?.readinessLevel || 'high');
    setEditRequiredAction(initiative.executiveDecision?.requiredAction || '');
    setEditInterventionPriority(initiative.executiveDecision?.interventionPriority || 'routine');
    setEditResponsibleEntity(initiative.executiveDecision?.responsibleEntity || 'السلطة المحلية والجمعية التعاونية');
    setEditNextFollowUpDate(initiative.executiveDecision?.nextFollowUpDate || new Date().toISOString().split('T')[0]);
    setEditDelayReasonsText((initiative.evaluation?.delayReasons || []).join('\n'));
    setEditObstaclesText((initiative.evaluation?.obstacles || []).join('\n'));
    setEditRequiredNeedsText((initiative.evaluation?.requiredNeeds || []).join('\n'));
    setIsEditingDecision(true);
  };

  const handleSaveExecutiveDecision = () => {
    const updatedEvaluation: InitiativeEvaluation = {
      ...initiative.evaluation,
      readinessLevel: editReadinessLevel,
      delayReasons: editDelayReasonsText.split('\n').filter(s => s.trim()),
      obstacles: editObstaclesText.split('\n').filter(s => s.trim()),
      requiredNeeds: editRequiredNeedsText.split('\n').filter(s => s.trim()),
      lastEvaluationDate: new Date().toISOString().split('T')[0]
    };

    const updatedDecision: ExecutiveDecisionData = {
      ...initiative.executiveDecision,
      requiredAction: editRequiredAction.trim() || 'متابعة المبادرة ميدانياً وتنفيذ الملاحظات الهندسية',
      interventionPriority: editInterventionPriority,
      responsibleEntity: editResponsibleEntity.trim() || 'السلطة المحلية والجمعية',
      nextFollowUpDate: editNextFollowUpDate || new Date().toISOString().split('T')[0],
      decisionMaker: initiative.executiveDecision?.decisionMaker || 'مدير عام وحدة التدخلات المركزية / السلطة المحلية',
      decisionDate: new Date().toISOString().split('T')[0],
      executionStatus: 'in_execution'
    };

    onUpdate({
      ...initiative,
      lifecycleStage: editLifecycleStage,
      decisionCategory: editDecisionCategory,
      evaluation: updatedEvaluation,
      executiveDecision: updatedDecision
    });

    setIsEditingDecision(false);
  };

  const handleQuickChangeLifecycleStage = (stage: InitiativeLifecycleStage) => {
    onUpdate({
      ...initiative,
      lifecycleStage: stage
    });
  };

  const handleAddMonitoringLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogNotes.trim() && !newLogAction.trim()) return;

    const newLog: MonitoringLogEntry = {
      id: `m_log_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      projectStatus: newLogStatus,
      actionTaken: newLogAction.trim() || 'متابعة ميدانية واستكمال الصب',
      responsiblePerson: newLogResponsible.trim() || 'الجمعية واللجنة الميدانية',
      progressRate: Number(newLogProgress) || 0,
      notes: newLogNotes.trim() || 'تم تنفيذ النزول الميداني وتدوين الملاحظات',
      createdRole: role
    };

    const existingTimeline = initiative.monitoringTimeline || [];
    onUpdate({
      ...initiative,
      monitoringTimeline: [newLog, ...existingTimeline]
    });

    setNewLogAction('');
    setNewLogNotes('');
    setShowAddLogModal(false);
  };

  // Budget & Contributions & Metadata editing state
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editSubDistrict, setEditSubDistrict] = useState('');
  const [editVillage, setEditVillage] = useState('');
  const [editCoordinates, setEditCoordinates] = useState('');
  const [editSector, setEditSector] = useState('');
  const [editInitiativeNumber, setEditInitiativeNumber] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editCost, setEditCost] = useState('');
  const [editCommunity, setEditCommunity] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editCompletionRate, setEditCompletionRate] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editMaterialsApproved, setEditMaterialsApproved] = useState('');
  const [editMaterialsDisbursed, setEditMaterialsDisbursed] = useState('');
  const [editMaterialsRemaining, setEditMaterialsRemaining] = useState('');
  const [editMaterialsUsed, setEditMaterialsUsed] = useState('');
  const [editDieselApproved, setEditDieselApproved] = useState('');
  const [editDieselDisbursed, setEditDieselDisbursed] = useState('');
  const [editDieselRemaining, setEditDieselRemaining] = useState('');
  const [editDieselUsed, setEditDieselUsed] = useState('');
  const [editBeneficiaries, setEditBeneficiaries] = useState('');
  const [editTotalDistance, setEditTotalDistance] = useState('');

  const handleStartEditBudget = () => {
    setEditName(initiative.name);
    setEditDistrict(initiative.district);
    setEditSubDistrict(initiative.subDistrict || '');
    setEditVillage(initiative.village || '');
    setEditCoordinates(initiative.coordinates || '');
    setEditSector(initiative.sector || 'الطرق');
    setEditInitiativeNumber(initiative.initiativeNumber || '');
    setEditEndDate(initiative.endDate || '');
    setEditCost(String(initiative.cost || (initiative.communityContribution + initiative.unitContribution)));
    setEditCommunity(String(initiative.communityContribution));
    setEditUnit(String(initiative.unitContribution));
    setEditCompletionRate(String(initiative.completionRate || 0));
    setEditStartDate(initiative.startDate || '٢٠٢٦-٠١-٠١');
    setEditMaterialsApproved(initiative.materialsApproved || '');
    setEditMaterialsDisbursed(initiative.materialsDisbursed || '');
    setEditMaterialsRemaining(initiative.materialsRemaining || '');
    setEditMaterialsUsed(initiative.materialsUsed || '');
    setEditDieselApproved(initiative.dieselApproved || '');
    setEditDieselDisbursed(initiative.dieselDisbursed || '');
    setEditDieselRemaining(initiative.dieselRemaining || '');
    setEditDieselUsed(initiative.dieselUsed || '');
    setEditBeneficiaries(String(initiative.beneficiaries || getImpactMetrics(initiative).beneficiaries));
    setEditTotalDistance(String(initiative.totalDistance || getImpactMetrics(initiative).totalDistance));
    setIsEditingBudget(true);
  };

  const handleSaveBudget = () => {
    const cDisb = parseNum(editMaterialsDisbursed);
    const cUsed = parseNum(editMaterialsUsed);
    const calcCementRem = (cDisb > 0 || cUsed > 0) ? `${Math.max(0, cDisb - cUsed)} كيس` : editMaterialsRemaining;

    const dDisb = parseNum(editDieselDisbursed);
    const dUsed = parseNum(editDieselUsed);
    const calcDieselRem = (dDisb > 0 || dUsed > 0) ? `${Math.max(0, dDisb - dUsed)} لتر` : editDieselRemaining;

    onUpdate({
      ...initiative,
      name: editName.trim() || initiative.name,
      district: editDistrict.trim() || initiative.district,
      subDistrict: editSubDistrict.trim() || initiative.subDistrict,
      village: editVillage.trim() || initiative.village,
      coordinates: editCoordinates.trim() || initiative.coordinates,
      sector: editSector.trim() || initiative.sector,
      initiativeNumber: editInitiativeNumber.trim() || initiative.initiativeNumber,
      endDate: editEndDate.trim() || initiative.endDate,
      cost: Number(editCost) || 0,
      communityContribution: Number(editCommunity) || 0,
      unitContribution: Number(editUnit) || 0,
      completionRate: Math.min(100, Math.max(0, Number(editCompletionRate) || 0)),
      startDate: editStartDate,
      materialsApproved: editMaterialsApproved,
      materialsDisbursed: editMaterialsDisbursed,
      materialsRemaining: calcCementRem,
      materialsUsed: editMaterialsUsed,
      dieselApproved: editDieselApproved,
      dieselDisbursed: editDieselDisbursed,
      dieselRemaining: calcDieselRem,
      dieselUsed: editDieselUsed,
      beneficiaries: Number(editBeneficiaries) || 0,
      totalDistance: Number(editTotalDistance) || 0,
      updatedAt: new Date().toISOString()
    });
    setIsEditingBudget(false);
  };

  // --- Form States ---
  // Contribution Form
  const [donorName, setDonorName] = useState('');
  const [contribType, setContribType] = useState<'cash' | 'inkind_material' | 'inkind_labor'>('cash');
  const [contribDesc, setContribDesc] = useState('');
  const [contribVal, setContribVal] = useState<number>(0);

  // Material Form
  const [matName, setMatName] = useState('');
  const [matQty, setMatQty] = useState<number>(1);
  const [matUnit, setMatUnit] = useState('كيس');
  const [matLoc, setMatLoc] = useState('');
  const [matStatus, setMatStatus] = useState<'safe' | 'at_risk'>('safe');

  // Committee Form
  const [memName, setMemName] = useState('');
  const [memRole, setMemRole] = useState<'leader' | 'knight' | 'auditor' | 'member'>('knight');
  const [memPhone, setMemPhone] = useState('');

  // Field Report Form
  const [repTitle, setRepTitle] = useState('');
  const [repDesc, setRepDesc] = useState('');
  const [repMatched, setRepMatched] = useState(true);
  const [repAchievement, setRepAchievement] = useState('');
  const [repAchievementsList, setRepAchievementsList] = useState<string[]>([]);
  const [repChallenge, setRepChallenge] = useState('');
  const [repChallengesList, setRepChallengesList] = useState<string[]>([]);
  const [repTheme, setRepTheme] = useState('road_paving');

  // Stagnation editing state
  const [isEditingStagnation, setIsEditingStagnation] = useState(false);
  const [stagnationReasonText, setStagnationReasonText] = useState(initiative.stagnationReason || '');

  // Active status dropdown state
  const [currentStatus, setCurrentStatus] = useState<Initiative['status']>(initiative.status);

  // Editing contribution state
  const [editingContribId, setEditingContribId] = useState<string | null>(null);

  // --- Change Handlers ---
  const handleUpdateStatus = (newStatus: Initiative['status']) => {
    setCurrentStatus(newStatus);
    const updated = {
      ...initiative,
      status: newStatus,
      stagnationReason: newStatus === 'stagnant' ? stagnationReasonText : undefined
    };
    onUpdate(updated);
  };

  const handleSaveStagnationReason = () => {
    const updated = {
      ...initiative,
      status: 'stagnant' as const,
      stagnationReason: stagnationReasonText
    };
    onUpdate(updated);
    setIsEditingStagnation(false);
  };

  const handleToggleTask = (pathwayId: number, taskId: string, customNotes?: string) => {
    const updatedPathways = initiative.pathways.map(p => {
      if (p.id === pathwayId) {
        return {
          ...p,
          tasks: p.tasks.map(t => {
            if (t.id === taskId) {
              const nextState = !t.completed;
              return {
                ...t,
                completed: nextState,
                completedAt: nextState ? new Date().toISOString().split('T')[0] : undefined,
                notes: customNotes !== undefined ? customNotes : t.notes
              };
            }
            return t;
          })
        };
      }
      return p;
    });

    onUpdate({ ...initiative, pathways: updatedPathways });
  };

  const handleUpdateTaskNotes = (pathwayId: number, taskId: string, notes: string) => {
    const updatedPathways = initiative.pathways.map(p => {
      if (p.id === pathwayId) {
        return {
          ...p,
          tasks: p.tasks.map(t => {
            if (t.id === taskId) {
              return { ...t, notes };
            }
            return t;
          })
        };
      }
      return p;
    });

    onUpdate({ ...initiative, pathways: updatedPathways });
  };

  // Confirm Community Ownership Toggle
  const handleToggleOwnerConfirmed = () => {
    onUpdate({ ...initiative, ownerConfirmed: !initiative.ownerConfirmed });
  };

  // Add or Edit Contribution
  const handleAddContribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName.trim() || contribVal <= 0) return;

    if (editingContribId) {
      // Edit existing contribution
      const updatedContributions = initiative.contributions.map(c => {
        if (c.id === editingContribId) {
          return {
            ...c,
            donorName: donorName.trim(),
            type: contribType,
            description: contribDesc.trim() || 'مساهمة مجتمعية لدعم تفعيل المبادرة',
            value: Number(contribVal)
          };
        }
        return c;
      });
      onUpdate({
        ...initiative,
        contributions: updatedContributions
      });
      setEditingContribId(null);
    } else {
      // Add new contribution
      const newContrib: Contribution = {
        id: `c_${Date.now()}`,
        donorName: donorName.trim(),
        type: contribType,
        description: contribDesc.trim() || 'مساهمة مجتمعية لدعم تفعيل المبادرة',
        value: Number(contribVal),
        date: new Date().toISOString().split('T')[0]
      };

      onUpdate({
        ...initiative,
        contributions: [newContrib, ...initiative.contributions]
      });
    }

    setDonorName('');
    setContribDesc('');
    setContribVal(0);
  };

  const handleStartEditContribution = (contrib: Contribution) => {
    setEditingContribId(contrib.id);
    setDonorName(contrib.donorName);
    setContribType(contrib.type);
    setContribVal(contrib.value);
    setContribDesc(contrib.description);
  };

  const handleCancelEditContribution = () => {
    setEditingContribId(null);
    setDonorName('');
    setContribType('cash');
    setContribVal(0);
    setContribDesc('');
  };

  // Delete Contribution
  const handleDeleteContribution = (id: string) => {
    if (editingContribId === id) {
      handleCancelEditContribution();
    }
    onUpdate({
      ...initiative,
      contributions: initiative.contributions.filter(c => c.id !== id)
    });
  };

  // Add Material
  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matName.trim() || matQty <= 0) return;

    const newMat: Material = {
      id: `m_${Date.now()}`,
      name: matName.trim(),
      quantity: Number(matQty),
      unit: matUnit,
      status: matStatus,
      storageLocation: matLoc.trim() || 'مستودع المبادرة الميداني الجديد',
      updatedAt: new Date().toISOString().split('T')[0]
    };

    onUpdate({
      ...initiative,
      materials: [newMat, ...initiative.materials]
    });

    setMatName('');
    setMatQty(1);
    setMatLoc('');
  };

  // Perform Material Transfer (المناقلات) - Pathway 3 feature
  const handleTransferMaterial = (materialId: string, targetLocation: string) => {
    if (!targetLocation.trim()) return;

    const updatedMaterials = initiative.materials.map(m => {
      if (m.id === materialId) {
        return {
          ...m,
          storageLocation: targetLocation.trim(),
          status: 'safe' as const, // Assumed safe after transfer to new site
          updatedAt: new Date().toISOString().split('T')[0],
          notes: `تمت المناقلة بنجاح وتوفير وسائل النقل لترحيل المواد إلى الموقع الجديد السليم.`
        };
      }
      return m;
    });

    onUpdate({
      ...initiative,
      materials: updatedMaterials
    });

    // Mark task "المساعدة في توفير وسائل النقل" as complete in Pathway 3
    const updatedPathways = initiative.pathways.map(p => {
      if (p.id === 3) {
        return {
          ...p,
          tasks: p.tasks.map(t => {
            // Task index 0: المساعدة في توفير وسائل النقل
            // Task index 1: استلام المواد في الموقع الجديد
            if (t.id === 'p3_t1' || t.id === 'p3_t2') {
              return {
                ...t,
                completed: true,
                completedAt: new Date().toISOString().split('T')[0],
                notes: `تم النقل الفعلي للمواد المهددة وتأمين وصولها للمستودع الجديد: ${targetLocation}`
              };
            }
            return t;
          })
        };
      }
      return p;
    });

    onUpdate({
      ...initiative,
      materials: updatedMaterials,
      pathways: updatedPathways
    });
  };

  // Add Committee Member
  const handleAddCommitteeMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memName.trim()) return;

    const newMem: CommitteeMember = {
      id: `com_${Date.now()}`,
      name: memName.trim(),
      role: memRole,
      phone: memPhone.trim() || 'غير متوفر',
      tasksAssigned: memRole === 'knight' ? 6 : 2
    };

    onUpdate({
      ...initiative,
      committee: [...initiative.committee, newMem]
    });

    setMemName('');
    setMemPhone('');
  };

  // Remove Member
  const handleRemoveCommitteeMember = (id: string) => {
    onUpdate({
      ...initiative,
      committee: initiative.committee.filter(c => c.id !== id)
    });
  };

  // Add Achievement to local list before report submission
  const handleAddAchievementToList = () => {
    if (repAchievement.trim()) {
      setRepAchievementsList([...repAchievementsList, repAchievement.trim()]);
      setRepAchievement('');
    }
  };

  // Add Challenge to local list before report submission
  const handleAddChallengeToList = () => {
    if (repChallenge.trim()) {
      setRepChallengesList([...repChallengesList, repChallenge.trim()]);
      setRepChallenge('');
    }
  };

  // Create Field Report - Pathway 5 feature
  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repTitle.trim() || !repDesc.trim()) return;

    const newRep: FieldReport = {
      id: `rep_${Date.now()}`,
      title: repTitle.trim(),
      date: new Date().toISOString().split('T')[0],
      description: repDesc.trim(),
      isMatchedWithDeskReview: repMatched,
      status: 'submitted',
      achievements: repAchievementsList.length > 0 ? repAchievementsList : ['مستمر العمل بمسؤولية تامة'],
      challenges: repChallengesList.length > 0 ? repChallengesList : ['لا يوجد تحديات بارزة حالياً'],
      imagePlaceholder: repTheme
    };

    onUpdate({
      ...initiative,
      reports: [newRep, ...initiative.reports]
    });

    // Mark Pathway 5 task "مطابقة التقارير الميدانية مع صور الإنجاز والفرز المكتبي المسبق" as completed!
    const updatedPathways = initiative.pathways.map(p => {
      if (p.id === 5) {
        return {
          ...p,
          tasks: p.tasks.map(t => {
            if (t.id === 'p5_t1' || t.id === 'p5_t3') {
              return {
                ...t,
                completed: true,
                completedAt: new Date().toISOString().split('T')[0],
                notes: `تم إنشاء التقرير الميداني وتثبيت المطابقة الفنية بنجاح في تاريخ اليوم.`
              };
            }
            return t;
          })
        };
      }
      return p;
    });

    onUpdate({
      ...initiative,
      reports: [newRep, ...initiative.reports],
      pathways: updatedPathways
    });

    // Reset Form
    setRepTitle('');
    setRepDesc('');
    setRepAchievementsList([]);
    setRepChallengesList([]);
  };

  // Highlight community contributors for social media copy (Pathway 4 feature)
  const generateMediaPostText = () => {
    const totalContValue = initiative.contributions.reduce((sum, c) => sum + c.value, 0);
    const contributionsString = initiative.contributions
      .slice(0, 3)
      .map(c => {
        const typeAr = c.type === 'cash' ? 'تبرع نقدي' : c.type === 'inkind_material' ? 'مواد عينية' : 'عمل تطوعي';
        return `• البطل: ${c.donorName} بتقديم (${c.description}) بقيمة تقديرية تقارب ${c.value.toLocaleString('ar-YE')} ريال.`;
      })
      .join('\n');

    return `📢 تنمية وعطاء ومبادرة مجتمعية ملهمة!
تعلن الجمعية التعاونية في ${initiative.district} عن تحقيق خطوات جبارة في:
🔨 *${initiative.name}*

تحت مظلة سياسة العمل التنموي المتكامل والإدارة بالنتائج، يضرب أهالي هذه المنطقة الكريمة أروع أمثلة التضحية والتعاون الذاتي بالجهود والمساهمات الخاصة.

📈 القيمة الإجمالية للمساهمات المجتمعية الذاتية الموثقة حتى اليوم: *${totalContValue.toLocaleString('ar-YE')} ريال يمني!*

واليكم أبرز النماذج والقدوات التنموية الميدانية التي نعتز بها:
${contributionsString || '• مساهمات مستمرة ومثابرة يومية من سائر أبناء المنطقة الأوفياء.'}

كل الشكر والتقدير لفرسان المبادرة واللجنة المجتمعية على جهودهم الجبارة في التوثيق والمتابعة الفنية للمواد والتخزين الآمن.
#العمل_التنموي_المتكامل #المبادرات_المجتمعية #الجمعية_التعاونية #اليمن`;
  };

  const handleCopyToClipboard = () => {
    const text = generateMediaPostText();
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Total sums
  const totalContValue = initiative.contributions.reduce((sum, c) => sum + c.value, 0);
  const totalTasks = initiative.pathways.reduce((sum, p) => sum + p.tasks.length, 0);
  const completedTasks = initiative.pathways.reduce((sum, p) => sum + p.tasks.filter(t => t.completed).length, 0);
  const progressPercent = Math.round((completedTasks / totalTasks) * 100);

  const getPathwayIcon = (iconName: string) => {
    switch (iconName) {
      case 'Search': return <Search className="w-5 h-5 text-emerald-600" />;
      case 'Users': return <Users className="w-5 h-5 text-indigo-600" />;
      case 'Truck': return <Truck className="w-5 h-5 text-amber-600" />;
      case 'Megaphone': return <Megaphone className="w-5 h-5 text-sky-600" />;
      case 'ClipboardCheck': return <ClipboardCheck className="w-5 h-5 text-rose-600" />;
      default: return <FileCheck className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6" dir="rtl" id={`initiative-detail-${initiative.id}`}>
      {/* Back button and status header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm hover:scale-102 active:scale-98"
            title="الرجوع لقائمة المبادرات"
          >
            <ChevronLeft className="w-4 h-4 transform rotate-180 text-amber-400" />
            <span>↩️ رجوع لقائمة المبادرات</span>
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500">{initiative.district} • {initiative.governorate}</span>
              {initiative.subDistrict && (
                <>
                  <span className="text-slate-300">|</span>
                  <span className="text-xs font-extrabold text-slate-600">عزلة: {initiative.subDistrict}</span>
                </>
              )}
              {initiative.village && (
                <>
                  <span className="text-slate-300">|</span>
                  <span className="text-xs font-bold text-slate-600">قرية: {initiative.village}</span>
                </>
              )}
              {initiative.sector && (
                <>
                  <span className="text-slate-300">|</span>
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">القطاع: {initiative.sector}</span>
                </>
              )}
              {initiative.initiativeNumber && (
                <>
                  <span className="text-slate-300">|</span>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">كود: {initiative.initiativeNumber}</span>
                </>
              )}
              <span className="text-slate-300">|</span>
              <span className="text-xs text-slate-400">تاريخ التسجيل: {initiative.createdAt}</span>
              <span className="text-slate-300">|</span>
              <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md font-extrabold flex items-center gap-1 border border-emerald-100 shadow-3xs">
                <span>📅 تاريخ بداية المشروع:</span>
                <span className="font-black">{initiative.startDate || '٢٠٢٦-٠١-٠١'}</span>
              </span>
              {initiative.endDate && (
                <>
                  <span className="text-slate-300">|</span>
                  <span className="text-xs text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md font-extrabold flex items-center gap-1 border border-blue-100 shadow-3xs">
                    <span>🏁 تاريخ الانتهاء:</span>
                    <span className="font-black">{initiative.endDate}</span>
                  </span>
                </>
              )}
              {initiative.coordinates && (
                <>
                  <span className="text-slate-300">|</span>
                  <span className="text-xs text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded-md font-mono flex items-center gap-1 border border-slate-100 shadow-3xs" dir="ltr">
                    <span>📍 {initiative.coordinates}</span>
                  </span>
                </>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1 leading-snug">{initiative.name}</h1>
          </div>
        </div>

        {/* Change status & community ownership confirmation */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Ownership toggle button */}
          {!hasPermission(role, 'canDocumentContributions') && !hasPermission(role, 'canApproveInitiative') ? (
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border ${
                initiative.ownerConfirmed
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              {initiative.ownerConfirmed ? 'تم إثبات ملكية المجتمع وحمايته ✓' : 'لم يتم إثبات ملكية المجتمع بعد'}
            </div>
          ) : (
            <button
              onClick={handleToggleOwnerConfirmed}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                initiative.ownerConfirmed
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                  : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              {initiative.ownerConfirmed ? 'تم إثبات ملكية المجتمع وحمايته' : 'لم يتم إثبات ملكية المجتمع بعد'}
            </button>
          )}

          {/* Status Select */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <span className="text-xs font-bold text-slate-500">حالة التنفيذ:</span>
            {!hasPermission(role, 'canClassifyStatus') ? (
              <span className="text-xs text-slate-800 font-bold px-1.5">
                {currentStatus === 'completed' ? 'منجزة ✓' :
                 currentStatus === 'ongoing' ? 'قيد التنفيذ 🚧' :
                 currentStatus === 'stagnant' ? 'متعثرة ⚠️' :
                 currentStatus === 'stopped' ? 'متوقفة 🛑' : 'لم تبدأ ⏳'}
              </span>
            ) : (
              <select
                value={currentStatus}
                onChange={(e) => handleUpdateStatus(e.target.value as Initiative['status'])}
                className="bg-transparent text-xs text-slate-800 font-bold focus:outline-none cursor-pointer"
              >
                <option value="pending">لم تبدأ</option>
                <option value="ongoing">قيد التنفيذ</option>
                <option value="stagnant">متعثرة</option>
                <option value="stopped">متوقفة</option>
                <option value="completed">منجزة</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* 🧠 بطاقة المبادرة الذكية والمستشار التنموي الشامل V4 */}
      <SmartInitiativeCard
        initiative={initiative}
        onUpdateInitiative={onUpdate}
        userRole={role}
        onBack={onBack}
        onNavigateTab={onNavigateTab}
      />

      {/* 🚀 مسار دورة حياة المبادرة التشغيلية (Initiative Lifecycle Track) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span>🔄</span>
              <span>مسار دورة حياة المبادرة التشغيلية:</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              المرحلة الحالية: {
                initiative.lifecycleStage === 'approved' ? 'المبادرة المعتمدة' :
                initiative.lifecycleStage === 'current_monitoring' ? 'المتابعة الحالية' :
                initiative.lifecycleStage === 'field_evaluation' ? 'التقييم الميداني' :
                initiative.lifecycleStage === 'status_classification' ? 'تصنيف الحالة' :
                initiative.lifecycleStage === 'decision_determination' ? 'تحديد القرار' :
                initiative.lifecycleStage === 'action_execution' ? 'تنفيذ الإجراء' : 'قياس النتائج والأثر'
              }
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-bold">يمكن الانتقال بين المراحل بالنقر المباشر</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {[
            { id: 'approved', label: '1. معتمدة', icon: '📜', desc: 'اعتماد المبادرة' },
            { id: 'current_monitoring', label: '2. متابعة حالية', icon: '🔍', desc: 'تتبع سير العمل' },
            { id: 'field_evaluation', label: '3. تقييم ميداني', icon: '📋', desc: 'فحص الجاهزية' },
            { id: 'status_classification', label: '4. تصنيف الحالة', icon: '🏷️', desc: 'تحديد مسار القرار' },
            { id: 'decision_determination', label: '5. تحديد القرار', icon: '⚖️', desc: 'صياغة التوجيه' },
            { id: 'action_execution', label: '6. تنفيذ الإجراء', icon: '🚀', desc: 'المتابعة الميدانية' },
            { id: 'impact_followup', label: '7. قياس النتائج', icon: '🏆', desc: 'توثيق الأثر' },
          ].map((stg, idx) => {
            const isCurrent = (initiative.lifecycleStage || 'approved') === stg.id;
            const stagesOrder = ['approved', 'current_monitoring', 'field_evaluation', 'status_classification', 'decision_determination', 'action_execution', 'impact_followup'];
            const currentIdx = stagesOrder.indexOf(initiative.lifecycleStage || 'approved');
            const isPassed = idx < currentIdx;

            return (
              <button
                key={stg.id}
                onClick={() => handleQuickChangeLifecycleStage(stg.id as InitiativeLifecycleStage)}
                className={`p-2.5 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center justify-between min-h-[72px] ${
                  isCurrent
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-300'
                    : isPassed
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs">{stg.icon}</span>
                  <span className="text-[11px] font-black">{stg.label}</span>
                </div>
                <span className={`text-[9px] mt-1 font-semibold ${isCurrent ? 'text-emerald-100' : 'text-slate-500'}`}>
                  {stg.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pending (لم يبدأ) Info Banner */}
      {currentStatus === 'pending' && (
        <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-5 space-y-2 animate-fadeIn">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="space-y-1 text-right">
              <h3 className="font-black text-amber-900 text-sm">مبادرة معتمدة بمصفوفة وحدة التدخلات (لم تبدأ بعد)</h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                تعني هذه الحالة أن المبادرة <strong>معتمدة رسمياً بمصفوفة وحدة التدخلات المركزية</strong>، ولكن العمل الميداني <strong>لم يبدأ بعد</strong>، ولم يتم صرف أو تسليم مساهمة الوحدة التنموية لها (كالإسمنت أو الديزل) نظراً <strong>لعدم تفاعل واستجابة المجتمع المحلي</strong> حتى الآن.
              </p>
              <div className="text-[10px] text-amber-700/85 pt-1.5 border-t border-amber-200/50 mt-1.5 flex items-center gap-1">
                <span className="font-black">💡 خطة العمل التعبوية:</span>
                <span>تتطلب هذه الحالة التدخل عبر حشد همم الأهالي وتوعيتهم بأهمية تفعيل المبادرة وعقد اللقاءات التأسيسية لتشكيل لجنة للمشروع.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stagnant/Stopped details if applicable */}
      {(currentStatus === 'stagnant' || currentStatus === 'stopped' || isEditingStagnation) && (() => {
        const isStopped = currentStatus === 'stopped';
        const bgColor = isStopped ? 'bg-slate-100 border-slate-200' : 'bg-rose-50 border-rose-100';
        const textColor = isStopped ? 'text-slate-900' : 'text-rose-900';
        const subTextColor = isStopped ? 'text-slate-600' : 'text-rose-800';
        const reasonColor = isStopped ? 'text-slate-700' : 'text-rose-700';
        const btnBgColor = isStopped ? 'bg-slate-700 hover:bg-slate-800' : 'bg-rose-600 hover:bg-rose-700';
        const btnBorderColor = isStopped ? 'border-slate-200' : 'border-rose-200';
        const btnTextColor = isStopped ? 'text-slate-700' : 'text-rose-700';
        const iconColor = isStopped ? 'text-slate-600' : 'text-rose-600';
        const headerText = isStopped ? 'بيان أسباب التوقف المؤقت للعمل (متطلب المسار الثالث)' : 'مستند إثبات التعثر وتبيان الأسباب (متطلب المسار الأول)';
        const descText = isStopped ? 'وفق سياسة العمل التنموي، يتم تسجيل أسباب التوقف المؤقت لجدولة المبادرة مجدداً واستغلال الموارد بشكل أمثل.' : 'وفق سياسة العمل التنموي، يلتزم ممثلو الجمعية بمرافقة اللجان الفنية وتوضيح عقبات ومسببات التعثر للوصول إلى معالجات حاسمة.';
        const placeholderText = isStopped ? 'اكتب بالتفصيل أسباب التوقف المؤقت (مثال: دخول موسم الأمطار والسيول، انشغال المجتمع بموسم الحصاد)...' : 'اكتب بالتفصيل أسباب التعثر الميداني (مثال: عدم ملاءمة الأحجار للمواصفات الفنية، شح الوقود لنقل الحجارة، حدوث نزاع مجتمعي طفيف)...';
        const saveBtnText = isStopped ? 'تثبيت وتوثيق أسباب التوقف' : 'تثبيت وتوثيق أسباب التعثر';
        const emptyText = isStopped ? 'لم يتم تسجيل أسباب التوقف المؤقت بعد. اضغط تعديل لتسجيل أسباب توقف العمل.' : 'لم يتم تسجيل مسببات التعثر بعد. اضغط تعديل لتسجيل أسباب توقف العمل.';

        return (
          <div className={`${bgColor} border rounded-2xl p-5 space-y-3`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className={`w-5 h-5 ${iconColor} mt-0.5 shrink-0`} />
              <div className="space-y-1 w-full">
                <h3 className={`font-bold ${textColor} text-sm`}>{headerText}</h3>
                <p className={`text-xs ${subTextColor}`}>{descText}</p>

                {isEditingStagnation ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={stagnationReasonText}
                      onChange={(e) => setStagnationReasonText(e.target.value)}
                      placeholder={placeholderText}
                      className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-lg p-3 focus:outline-none focus:border-emerald-500 min-h-[80px]"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setStagnationReasonText(initiative.stagnationReason || '');
                          setIsEditingStagnation(false);
                        }}
                        className="px-3 py-1.5 text-xs text-slate-500 bg-slate-100 rounded-md hover:bg-slate-200"
                      >
                        إلغاء
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveStagnationReason}
                        className={`px-4 py-1.5 text-xs text-white ${btnBgColor} rounded-md font-semibold`}
                      >
                        {saveBtnText}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center justify-between gap-4">
                    <p className={`text-xs ${reasonColor} italic font-medium`}>
                      {initiative.stagnationReason || emptyText}
                    </p>
                    <button
                      onClick={() => setIsEditingStagnation(true)}
                      className={`text-xs font-bold ${btnTextColor} hover:underline bg-white border ${btnBorderColor} px-3 py-1 rounded-lg shrink-0`}
                    >
                      تعديل الأسباب
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Executive Initiative Card Main View */}
      <div className="mb-6">
        <ExecutiveInitiativeCard
          initiative={initiative}
          onSelect={() => {}}
          onUpdateInitiative={onUpdate}
          role={role}
        />
      </div>

      {/* 4 Key Executive Cards: Summary, Completion Rate, Intervention Priority, Real Operational Stance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="executive-initiative-key-cards">
        {/* Card 1: Initiative Summary */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>📋 ملخص حالة المبادرة</span>
            <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
              {initiative.initiativeNumber || `IMP-${initiative.id.substr(0, 5)}`}
            </span>
          </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-slate-900 text-sm line-clamp-1">{initiative.name}</h4>
            <div className="flex items-center gap-1 text-[11px] text-slate-600 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{initiative.district} • {initiative.governorate}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
            <span className="text-slate-500">المرحلة:</span>
            <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              {initiative.lifecycleStage === 'approved' ? 'معتمدة' :
               initiative.lifecycleStage === 'current_monitoring' ? 'متابعة حالية' :
               initiative.lifecycleStage === 'field_evaluation' ? 'تقييم ميداني' :
               initiative.lifecycleStage === 'status_classification' ? 'تصنيف الحالة' :
               initiative.lifecycleStage === 'decision_determination' ? 'تحديد القرار' :
               initiative.lifecycleStage === 'action_execution' ? 'تنفيذ الإجراء' : 'قياس الأثر'}
            </span>
          </div>
        </div>

        {/* Card 2: Field Completion Rate */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>📈 نسبة الإنجاز الفني والميداني</span>
            <span className="text-emerald-700 font-black text-sm font-mono">{initiative.completionRate}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden my-1">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                initiative.completionRate >= 70 ? 'bg-emerald-600' : initiative.completionRate >= 35 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${initiative.completionRate}%` }}
            />
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
            <span className="text-slate-500">تكامل المسارات (المهام):</span>
            <span className="text-slate-800 font-extrabold">{completedTasks} من {totalTasks} ({progressPercent}%)</span>
          </div>
        </div>

        {/* Card 3: Intervention Priority */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>⚡ أولوية التدخل التنفيذي</span>
            <span className="text-[10px] text-slate-400">تصنيف وحدة التدخلات</span>
          </div>
          <div className="py-1">
            {initiative.status === 'stagnant' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-rose-100 text-rose-900 border border-rose-300 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                أولوية قصوى (عاجل جداً)
              </span>
            ) : initiative.status === 'stopped' || initiative.completionRate < 35 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                أولوية متوسطة (معالجة)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                أولوية اعتيادية (استمرار)
              </span>
            )}
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-600">
            <span>الجهة المسؤولة:</span>
            <span className="font-bold text-slate-800 truncate max-w-[120px]">
              {initiative.executiveDecision?.responsibleEntity || 'السلطة والجمعية'}
            </span>
          </div>
        </div>

        {/* Card 4: Real Operational Stance */}
        {(() => {
          let stanceText = 'طبيعي ومستقر';
          let stanceClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
          let stanceIcon = <CheckCircle2 className="w-4 h-4 text-emerald-600" />;

          if (initiative.status === 'stagnant' || !initiative.ownerConfirmed) {
            stanceText = 'يتطلب قرار تنفيذي';
            stanceClass = 'bg-rose-100 text-rose-900 border-rose-300 font-black animate-pulse';
            stanceIcon = <AlertTriangle className="w-4 h-4 text-rose-600" />;
          } else if (initiative.status === 'stopped' || initiative.materials?.some(m => m.status === 'at_risk')) {
            stanceText = 'يحتاج علاج عاجل';
            stanceClass = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
            stanceIcon = <ShieldAlert className="w-4 h-4 text-amber-600" />;
          } else if (initiative.completionRate < 35 || initiative.status === 'pending') {
            stanceText = 'يحتاج متابعة ميدانية';
            stanceClass = 'bg-amber-50 text-amber-800 border-amber-200';
            stanceIcon = <Clock className="w-4 h-4 text-amber-600" />;
          }

          return (
            <div className={`border rounded-2xl p-4 shadow-2xs space-y-2 ${stanceClass}`}>
              <div className="flex items-center justify-between text-xs font-bold">
                <span>🎯 الموقف التنفيذي الحقيقي</span>
                {stanceIcon}
              </div>
              <div className="py-1">
                <h4 className="font-extrabold text-sm md:text-base">{stanceText}</h4>
              </div>
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-bold">
                <span>تحديث الموقف:</span>
                <span>{initiative.executiveDecision?.decisionDate || 'اليوم'}</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Smart Alerts & Field Action System */}
      {(() => {
        const alerts: {
          id: string;
          type: 'danger' | 'warning' | 'info';
          title: string;
          desc: string;
          actionText?: string;
          actionTab?: 'pathways' | 'contributions' | 'materials' | 'media' | 'reports' | 'committee';
          pathwayId?: number;
        }[] = [];

        // 1. Check if initiative is stagnant
        if (initiative.status === 'stagnant') {
          alerts.push({
            id: 'stagnant',
            type: 'danger',
            title: 'تعثر ميداني معلن عاجل ⚠️',
            desc: `المبادرة متعثرة رسمياً بالميدان. السبب الموثق: "${initiative.stagnationReason || 'غير محدد بعد'}". يتطلب تفعيل المسار الأول وإيجاد معالجات حاسمة من قبل اللجنة المجتمعية والسلطة المحلية.`,
            actionText: 'تحديث حالة المبادرة ومسار المعالجة',
            actionTab: 'pathways',
            pathwayId: 3
          });
        }

        // 2. Check Pathway 1: Diagnosis & Empowerment
        if (!initiative.ownerConfirmed) {
          alerts.push({
            id: 'p1_ownership',
            type: 'danger',
            title: 'تأخر مسار التمكين المجتمعي وإثبات الملكية 👥',
            desc: 'لم يتم توقيع مستند إثبات ملكية المجتمع وحمايته حتى الآن. هذا المستند حاسم لضمان صون وتخزين المواد ومنع النزاعات الأسرية.',
            actionText: 'إثبات ملكية المجتمع الفورية',
            actionTab: 'pathways',
            pathwayId: 1
          });
        }

        // 3. Check Pathway 2: Funding & Contributions
        const totalContValue = initiative.contributions?.reduce((sum, c) => sum + (c.value || 0), 0) || 0;
        const targetCommunityContrib = initiative.communityContribution || 0;
        if (initiative.status === 'ongoing' && targetCommunityContrib > 0 && totalContValue < targetCommunityContrib * 0.15) {
          alerts.push({
            id: 'p2_funding_gap',
            type: 'danger',
            title: 'فجوة تمويلية وحاجة عاجلة للتحشيد المالي 💸',
            desc: `إجمالي المساهمات المجتمعية الذاتية الفعلية الموثقة (${totalContValue.toLocaleString('ar-YE')} ريال) يقل عن 15% من المساهمة المقدرة بالدراسة (${targetCommunityContrib.toLocaleString('ar-YE')} ريال). يتطلب ذلك عقد لقاء حاشد مع المغتربين والفرسان.`,
            actionText: 'توثيق مساهمة جديدة وحشد الدعم',
            actionTab: 'contributions'
          });
        }

        // 4. Check Pathway 3: Logistical Storage Risk
        const hasAtRiskMaterials = initiative.materials?.some(m => m.status === 'at_risk') || false;
        if (hasAtRiskMaterials) {
          alerts.push({
            id: 'p3_materials_at_risk',
            type: 'danger',
            title: 'خطورة لوجستية: مواد بناء مهددة بالتلف بموقع مكشوف 🧱',
            desc: 'تم رصد مواد بناء (كالإسمنت أو الحديد) في مواقع تخزين غير آمنة أو مهددة بعوامل الرطوبة والأمطار. يتطلب تفعيل المناقلة العاجلة أو تأمين غطاء بلاستيكي.',
            actionText: 'إدارة مخزون المواد والمناقلات',
            actionTab: 'materials'
          });
        }

        // 5. Check Pathway 4: Media & Advocacy Gap
        const p4 = initiative.pathways?.find(p => p.id === 4);
        const p4Incomplete = p4 ? p4.tasks.some(t => !t.completed) : false;
        if (initiative.completionRate >= 50 && p4Incomplete) {
          alerts.push({
            id: 'p4_media_gap',
            type: 'warning',
            title: 'تأخر المسار الإعلامي وحث الحاضنة المجتمعية 📢',
            desc: 'المبادرة حققت تقدماً فنياً ملحوظاً (تجاوزت 50%) دون مواكبة إعلامية لحث بقية الأسر والفرسان على استكمال العطاء وبث التنافس الإيجابي بين القرى.',
            actionText: 'نشر بوست إعلامي حاشد',
            actionTab: 'media'
          });
        }

        // 6. Check Pathway 5: Technical Audit Gap
        const hasNoReports = !initiative.reports || initiative.reports.length === 0;
        if (initiative.completionRate >= 70 && hasNoReports) {
          alerts.push({
            id: 'p5_audit_gap',
            type: 'danger',
            title: 'غياب مطابقة الرقابة الفنية ومقاييس الجودة 📋',
            desc: 'المبادرة تجاوزت نسبة إنجازها الفني 70% دون تقديم أي تقرير رقابة فنية ومطابقة ميدانية حتى الآن، مما يهدد بعدم قبول الاستلام النهائي للمشروع.',
            actionText: 'إنشاء تقرير رقابة ومطابقة فنية',
            actionTab: 'reports'
          });
        }

        // 7. Diagnostic Signal: Cement Over-disbursement (صرف إسمنت فوق المعتمد)
        const parseMatNum = (val?: string | number): number => {
          if (val === undefined || val === null) return 0;
          if (typeof val === 'number') return isNaN(val) ? 0 : val;
          const cleaned = String(val).replace(/,/g, '').replace(/[^0-9.]/g, '');
          const num = parseFloat(cleaned);
          return isNaN(num) ? 0 : num;
        };

        const cementAppr = parseMatNum(initiative.materialsApproved);
        const cementDisb = parseMatNum(initiative.materialsDisbursed);
        if (cementDisb > cementAppr && cementAppr > 0) {
          alerts.push({
            id: 'cement_over_disbursed',
            type: 'warning',
            title: 'إشارة تشخيصية: صرف إسمنت فوق المعتمد ⚠️',
            desc: `المنصرف من الإسمنت (${cementDisb.toLocaleString()} كيس) يتجاوز المعتمد بالدراسة (${cementAppr.toLocaleString()} كيس) بفارق (+${(cementDisb - cementAppr).toLocaleString()} كيس).`,
            actionText: 'معاينة موقف الإسمنت',
            actionTab: 'materials'
          });
        }

        // 8. Diagnostic Signal: Diesel Over-disbursement (صرف ديزل فوق المعتمد)
        const dieselAppr = parseMatNum(initiative.dieselApproved);
        const dieselDisb = parseMatNum(initiative.dieselDisbursed);
        if (dieselDisb > dieselAppr && dieselAppr > 0) {
          alerts.push({
            id: 'diesel_over_disbursed',
            type: 'warning',
            title: 'إشارة تشخيصية: صرف ديزل فوق المعتمد ⚠️',
            desc: `المنصرف من الديزل (${dieselDisb.toLocaleString()} لتر) يتجاوز المعتمد بالدراسة (${dieselAppr.toLocaleString()} لتر) بفارق (+${(dieselDisb - dieselAppr).toLocaleString()} لتر).`,
            actionText: 'معاينة موقف الديزل',
            actionTab: 'materials'
          });
        }

        return (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700 font-extrabold flex items-center justify-center">
                  ⚠️
                </span>
                <div>
                  <h3 className="text-xs font-black text-slate-900">مركز المراقبة الذكي والتنبيهات الميدانية العاجلة</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">تحليل حي للمبادرة استناداً لمعايير مسارات التفعيل الخمسة ونموذج الإدارة بالنتائج</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-400">تحليل تلقائي</span>
            </div>

            {alerts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alerts.map((alert, idx) => {
                  const borderClass = alert.type === 'danger' 
                    ? 'border-rose-200 bg-rose-50/40 text-rose-950' 
                    : 'border-amber-200 bg-amber-50/40 text-amber-950';
                  
                  const dotClass = alert.type === 'danger' ? 'bg-rose-500' : 'bg-amber-500';

                  return (
                    <div 
                      key={idx} 
                      className={`border rounded-xl p-4 flex flex-col justify-between gap-3 shadow-3xs transition-all hover:shadow-xs ${borderClass}`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <span className={`w-2 h-2 rounded-full ${dotClass} animate-pulse shrink-0`}></span>
                          <span className="text-slate-900 font-black">{alert.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                          {alert.desc}
                        </p>
                      </div>

                      {alert.actionText && (
                        <button
                          onClick={() => {
                            if (alert.actionTab) {
                              setActiveTab(alert.actionTab);
                            }
                            if (alert.pathwayId) {
                              setSelectedPathwayId(alert.pathwayId);
                            }
                            const el = document.getElementById('details-tabs-bar');
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                          className="self-start text-[10px] font-black px-3 py-1.5 bg-slate-900 hover:bg-emerald-700 text-white rounded-lg transition-all cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          <span>{alert.actionText}</span>
                          <span>←</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                  ✓
                </div>
                <div>
                  <h4 className="text-xs font-black text-emerald-900">جميع مسارات التفعيل متناسقة وتعمل بكفاءة عالية وفق السياسة التنموية! 🌟</h4>
                  <p className="text-[10px] text-emerald-700 mt-0.5">
                    المبادرة تطبق معايير الإدارة بالنتائج والمشاركة الميدانية الفعالة وصيانة المواد بنجاح دون أي تأخرات أو عوائق مرصودة.
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Approved Financial Indicators & Contributions Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs" id="financial-indicators-block">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span className="text-base">📊</span>
              <span>المؤشرات المالية والمساهمات المعتمدة للمبادرة</span>
            </h3>
            <p className="text-[11px] text-slate-500">القيم الرسمية المعتمدة وفقاً لدراسة الجدوى الموثقة للمبادرة بالريال اليمني</p>
          </div>
          {role !== 'visitor' && !isEditingBudget && (
            <button
              onClick={handleStartEditBudget}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-500" />
              تعديل بيانات وموازنة المبادرة 📝
            </button>
          )}
        </div>

        {isEditingBudget ? (
          <div className="space-y-4 animate-fadeIn">
            {/* Core Metadata Fields Row */}
            <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-black text-indigo-900 flex items-center gap-1">
                <span>📝</span>
                <span>تعديل المسميات والمحتويات والبيانات الجغرافية</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-[11px] font-black text-slate-700">اسم المبادرة</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-black text-slate-700">المديرية</label>
                  <select
                    value={editDistrict}
                    onChange={(e) => setEditDistrict(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500 font-bold cursor-pointer"
                  >
                    <option value="مديرية ذي السفال">مديرية ذي السفال</option>
                    <option value="مديرية السياني">مديرية السياني</option>
                    <option value="مديرية جبلة">مديرية جبلة</option>
                    <option value="مديرية بعدان">مديرية بعدان</option>
                    <option value="مديرية السدة">مديرية السدة</option>
                    <option value="مديرية يريم">مديرية يريم</option>
                    <option value="مديرية المخادر">مديرية المخادر</option>
                    <option value="مديرية حبيش">مديرية حبيش</option>
                    <option value="مديرية حزم العدين">مديرية حزم العدين</option>
                    <option value="مديرية الرضمة">مديرية الرضمة</option>
                    <option value="مديرية القفر">مديرية القفر</option>
                    <option value="مديرية العدين">مديرية العدين</option>
                    <option value="مديرية ريف إب">مديرية ريف إب</option>
                    <option value="مديرية الظهار">مديرية الظهار</option>
                    <option value="مديرية المشنة">مديرية المشنة</option>
                    <option value="مديرية السبرة">مديرية السبرة</option>
                    <option value="مديرية الشعر">مديرية الشعر</option>
                    <option value="مديرية النادرة">مديرية النادرة</option>
                    <option value="مديرية فرع العدين">مديرية فرع العدين</option>
                    <option value="مديرية مذيخرة">مديرية مذيخرة</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-black text-slate-700">العزلة</label>
                  <input
                    type="text"
                    value={editSubDistrict}
                    onChange={(e) => setEditSubDistrict(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-black text-slate-700">القرية</label>
                  <input
                    type="text"
                    value={editVillage}
                    onChange={(e) => setEditVillage(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-black text-slate-700">الإحداثيات (خط طول، عرض)</label>
                  <input
                    type="text"
                    value={editCoordinates}
                    onChange={(e) => setEditCoordinates(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500 font-mono text-left"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-black text-slate-700">القطاع</label>
                  <input
                    type="text"
                    value={editSector}
                    onChange={(e) => setEditSector(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-black text-slate-700">كود / رقم المبادرة</label>
                  <input
                    type="text"
                    value={editInitiativeNumber}
                    onChange={(e) => setEditInitiativeNumber(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-black text-slate-700">تاريخ الانتهاء المتوقع</label>
                  <input
                    type="text"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500 font-bold text-right"
                    placeholder="مثال: ٢٠٢٦-١٢-٣٠"
                  />
                </div>
              </div>
            </div>

            {/* Financials Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">التكلفة الإجمالية التقديرية (ريال)</label>
                <input
                  type="number"
                  value={editCost}
                  onChange={(e) => setEditCost(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-left focus:outline-none focus:bg-white focus:border-emerald-500"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-emerald-700">✊ مساهمة المجتمع الذاتية (ريال)</label>
                <input
                  type="number"
                  value={editCommunity}
                  onChange={(e) => setEditCommunity(e.target.value)}
                  className="w-full bg-slate-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs font-mono text-left focus:outline-none focus:bg-white focus:border-emerald-500"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-indigo-700">🏛️ مساهمة وحدة التدخلات (ريال)</label>
                <input
                  type="number"
                  value={editUnit}
                  onChange={(e) => setEditUnit(e.target.value)}
                  className="w-full bg-slate-50 border border-indigo-200 rounded-lg px-3 py-2 text-xs font-mono text-left focus:outline-none focus:bg-white focus:border-indigo-500"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-amber-700">📈 نسبة الإنجاز الفني للمبادرة (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editCompletionRate}
                  onChange={(e) => setEditCompletionRate(e.target.value)}
                  className="w-full bg-slate-50 border border-amber-200 rounded-lg px-3 py-2 text-xs font-mono text-left focus:outline-none focus:bg-white focus:border-amber-500"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Date & Material Details Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 pt-3 border-t border-slate-100">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">📅 تاريخ بداية المشروع</label>
                <input
                  type="text"
                  placeholder="مثال: ٢٠٢٦-٠١-١٥"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-right focus:outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-indigo-700">📦 الأسمنت المعتمد (طن/كيس)</label>
                <input
                  type="text"
                  placeholder="مثال: 120 طن"
                  value={editMaterialsApproved}
                  onChange={(e) => setEditMaterialsApproved(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-center focus:outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-blue-700">🚚 الأسمنت المنصرف (طن/كيس)</label>
                <input
                  type="text"
                  placeholder="مثال: 80 طن"
                  value={editMaterialsDisbursed}
                  onChange={(e) => setEditMaterialsDisbursed(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-center focus:outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-rose-700">⚠️ الأسمنت المتبقي (طن/كيس)</label>
                <input
                  type="text"
                  placeholder="مثال: 40 طن"
                  value={editMaterialsRemaining}
                  onChange={(e) => setEditMaterialsRemaining(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-center focus:outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-emerald-700">🏗️ الأسمنت المستخدم (طن/كيس)</label>
                <input
                  type="text"
                  placeholder="مثال: 60 طن"
                  value={editMaterialsUsed}
                  onChange={(e) => setEditMaterialsUsed(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-center focus:outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Diesel Details Sub-section */}
            <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-4 space-y-3 mt-3">
              <h4 className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                <span className="text-sm">⛽</span>
                <span>الديزل والمحروقات المخصصة للمشروع (مساهمة وحدة التدخلات والشركاء)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-indigo-700">⛽ الديزل المعتمد (لتر)</label>
                  <input
                    type="text"
                    placeholder="مثال: 1500 لتر"
                    value={editDieselApproved}
                    onChange={(e) => setEditDieselApproved(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-center focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-blue-700">🚚 الديزل المنصرف (لتر)</label>
                  <input
                    type="text"
                    placeholder="مثال: 1000 لتر"
                    value={editDieselDisbursed}
                    onChange={(e) => setEditDieselDisbursed(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-center focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-rose-700">⚠️ الديزل المتبقي (لتر)</label>
                  <input
                    type="text"
                    placeholder="مثال: 500 لتر"
                    value={editDieselRemaining}
                    onChange={(e) => setEditDieselRemaining(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-center focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-emerald-700">🚜 الديزل المستهلك (لتر)</label>
                  <input
                    type="text"
                    placeholder="مثال: 800 لتر"
                    value={editDieselUsed}
                    onChange={(e) => setEditDieselUsed(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-center focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Developmental Impact Variables Sub-section */}
            <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-xl p-4 space-y-3 mt-3">
              <h4 className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                <span className="text-sm">📊</span>
                <span>المؤشرات الجغرافية والديموغرافية لحساب الأثر التنموي</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 text-right">
                  <label className="block text-xs font-bold text-slate-700">👥 عدد المستفيدين المباشرين (مواطن)</label>
                  <input
                    type="number"
                    placeholder="مثال: 3500"
                    value={editBeneficiaries}
                    onChange={(e) => setEditBeneficiaries(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 text-center font-mono font-bold text-slate-800"
                  />
                </div>
                <div className="space-y-1 text-right">
                  <label className="block text-xs font-bold text-slate-700">📏 مسافة الطريق الإجمالية المخططة (كم)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="مثال: 4.5"
                    value={editTotalDistance}
                    onChange={(e) => setEditTotalDistance(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 text-center font-mono font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsEditingBudget(false)}
                className="px-3 py-1.5 text-xs text-slate-500 bg-slate-100 rounded-md hover:bg-slate-200 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveBudget}
                className="px-4 py-1.5 text-xs text-white bg-emerald-600 rounded-md font-semibold hover:bg-emerald-700 cursor-pointer"
              >
                حفظ التحديث المالي والمواد
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Cost card */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex items-center gap-3">
                <div className="p-2.5 bg-slate-200/70 text-slate-700 rounded-lg font-bold text-base">💰</div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">التكلفة الكلية للمبادرة</span>
                  <span className="text-sm font-extrabold text-slate-800 font-mono">
                    {(initiative.cost || (initiative.communityContribution + initiative.unitContribution)).toLocaleString()} ريال
                  </span>
                </div>
              </div>

              {/* Community Contribution card */}
              <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-3.5 flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100/80 text-emerald-700 rounded-lg font-bold text-base">✊</div>
                <div>
                  <span className="text-[10px] text-emerald-800 font-bold block">مساهمة المجتمع الذاتية</span>
                  <span className="text-sm font-extrabold text-emerald-700 font-mono">
                    {(initiative.communityContribution || 0).toLocaleString()} ريال
                  </span>
                </div>
              </div>

              {/* Unit Contribution card */}
              <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-3.5 flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100/80 text-indigo-700 rounded-lg font-bold text-base">🏛️</div>
                <div>
                  <span className="text-[10px] text-indigo-800 font-bold block">مساهمة وحدة التدخلات المركزية</span>
                  <span className="text-sm font-extrabold text-indigo-700 font-mono">
                    {(initiative.unitContribution || 0).toLocaleString()} ريال
                  </span>
                </div>
              </div>
            </div>
            
            {/* Executive Materials Position & Custody Analysis Card */}
            <div className="mt-4">
              <MaterialsPositionCard
                initiative={initiative}
                onUpdateInitiative={onUpdate}
                role={role}
              />
            </div>

            {/* NEW SECTION: Developmental & Social Impact Scorecard */}
            {(() => {
              const impact = getImpactMetrics(initiative);
              return (
                <div className="mt-5 pt-4 border-t border-slate-200">
                  <h4 className="text-xs font-black text-emerald-800 mb-3 flex items-center gap-1.5 justify-start text-right">
                    <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
                    <span>📈 تقييم الأثر التنموي والاجتماعي المحقق للمبادرة:</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-right">
                    <div className="bg-slate-50/80 border border-slate-150 p-3 rounded-xl">
                      <span className="text-[10px] text-slate-500 font-bold block">👥 عدد المستفيدين المباشرين</span>
                      <span className="text-sm font-black text-slate-800 mt-1 block font-mono">
                        {impact.beneficiaries.toLocaleString('ar-YE')} مواطن
                      </span>
                    </div>
                    <div className="bg-slate-50/80 border border-slate-150 p-3 rounded-xl">
                      <span className="text-[10px] text-slate-500 font-bold block">📏 مسافة الطريق الكلية</span>
                      <span className="text-sm font-black text-slate-800 mt-1 block font-mono">
                        {impact.totalDistance} كم
                      </span>
                    </div>
                    <div className="bg-blue-50/30 border border-blue-100 p-3 rounded-xl">
                      <span className="text-[10px] text-blue-700 font-bold block font-sans">🛣️ المسافة المنجزة فعلياً</span>
                      <span className="text-sm font-black text-blue-900 mt-1 block font-mono">
                        {impact.completedDistance} كم
                      </span>
                    </div>
                    <div className="bg-emerald-50/30 border border-emerald-100 p-3 rounded-xl">
                      <span className="text-[10px] text-emerald-700 font-black font-sans">🌟 الأثر التنموي المحقق</span>
                      <span className="text-sm font-black text-emerald-900 mt-1 block font-mono">
                        {impact.impactScore.toLocaleString('ar-YE')} مستفيد.كم
                      </span>
                    </div>
                  </div>
                  
                  {/* Dynamic Cost-Efficiency Advice */}
                  <div className="mt-3 bg-emerald-50/40 border border-emerald-100 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-emerald-800 font-extrabold block">💰 كفاءة تكلفة الإنجاز لكل مستفيد:</span>
                      <p className="text-[9.5px] text-emerald-700 leading-relaxed">
                        يبلغ متوسط تكلفة إيصال هذا الطريق المعبد لكل مواطن مستفيد حوالي <strong className="font-mono font-black text-xs text-emerald-900">{(impact.costPerBeneficiary || 0).toLocaleString()} ريال</strong>.
                      </p>
                    </div>
                    <div className="text-[9px] bg-emerald-100/60 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-lg font-black shrink-0">
                      كفاءة تنموية ممتازة ⚡
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* NEW SECTION: Technical Work Quantities Comparison (Sheet 3 Approved vs Sheet 2 Executed) */}
            {(initiative.approvedStudyQuantities || initiative.executedWorkQuantities || (initiative.executionCostCompleted && initiative.executionCostCompleted > 0) || initiative.notes) && (
              <div className="mt-5 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <h4 className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                    <span className="text-sm">📐</span>
                    <span>مقارنة الأعمال والبنود الفنية (المعتمدة بحسب الدراسة الفنية vs المنفذة ميدانياً):</span>
                  </h4>
                  {Boolean(initiative.executionCostCompleted && initiative.executionCostCompleted > 0) && (
                    <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                      تكلفة الأعمال المنجزة: {initiative.executionCostCompleted?.toLocaleString('ar-YE')} ريال
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/50">
                  <table className="w-full text-right text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                        <th className="p-2.5">البند والبيان الفني</th>
                        <th className="p-2.5 text-center bg-indigo-50/60 text-indigo-900 border-x border-slate-200">
                          📋 الكميات والمواصفات المعتمدة بالدراسة
                        </th>
                        <th className="p-2.5 text-center bg-emerald-50/60 text-emerald-900 border-x border-slate-200">
                          🏗️ الأعمال والكميات المنفذة ميدانياً
                        </th>
                        <th className="p-2.5 text-center">حالة الفرز الفني</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80 font-medium">
                      {[
                        { label: 'متوسط العرض (متر)', appKey: 'avgWidth', unit: 'م' },
                        { label: 'الطول الفني (متر)', appKey: 'lengthCompleted', unit: 'م' },
                        { label: 'أعمال الشق', appKey: 'excavationCut', unit: '' },
                        { label: 'أعمال التوسعة', appKey: 'expansion', unit: '' },
                        { label: 'أعمال المسح والتسوية', appKey: 'gradingLevelling', unit: '' },
                        { label: 'حفر انشائي (م3)', appKey: 'structuralExcavationM3', unit: 'م3' },
                        { label: 'جدران كتلية', appKey: 'blockWalls', unit: '' },
                        { label: 'مباني حجر', appKey: 'stoneMasonry', unit: '' },
                        { label: 'رصف حجري', appKey: 'stonePaving', unit: '' },
                        { label: 'رصف خرساني', appKey: 'concretePaving', unit: '' },
                      ].map((item, idx) => {
                        const approvedVal = initiative.approvedStudyQuantities?.[item.appKey as keyof typeof initiative.approvedStudyQuantities] || 0;
                        const executedVal = initiative.executedWorkQuantities?.[item.appKey as keyof typeof initiative.executedWorkQuantities] || 0;

                        if (!approvedVal && !executedVal) return null;

                        const diff = executedVal - approvedVal;
                        let statusBadge = (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">مطابق</span>
                        );

                        if (approvedVal > 0 && executedVal > 0) {
                          if (diff === 0) {
                            statusBadge = <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">مطابق 100%</span>;
                          } else if (diff > 0) {
                            statusBadge = <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">تجاوز إيجابي (+{diff} {item.unit})</span>;
                          } else {
                            statusBadge = <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">متبقي تنفيذه ({diff} {item.unit})</span>;
                          }
                        } else if (executedVal > 0) {
                          statusBadge = <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">منفذ بالميدان</span>;
                        } else if (approvedVal > 0) {
                          statusBadge = <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">معتمد بالدراسة</span>;
                        }

                        return (
                          <tr key={idx} className="hover:bg-white transition-colors">
                            <td className="p-2.5 font-bold text-slate-800">{item.label}</td>
                            <td className="p-2.5 text-center font-mono font-bold text-indigo-900 bg-indigo-50/20 border-x border-slate-200">
                              {approvedVal ? `${approvedVal.toLocaleString('ar-YE')} ${item.unit}` : '-'}
                            </td>
                            <td className="p-2.5 text-center font-mono font-bold text-emerald-900 bg-emerald-50/20 border-x border-slate-200">
                              {executedVal ? `${executedVal.toLocaleString('ar-YE')} ${item.unit}` : '-'}
                            </td>
                            <td className="p-2.5 text-center">{statusBadge}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {initiative.notes && (
                  <div className="mt-3 bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 text-right">
                    <span className="text-[10px] text-amber-900 font-black block">📝 ملاحظات الشيت والإشراف الميداني الهندسي:</span>
                    <p className="text-xs text-amber-800 font-semibold mt-1 leading-relaxed">{initiative.notes}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 pb-px scrollbar-thin" id="detail-tabs">
        <button
          onClick={() => setActiveTab('executive_decision')}
          className={`px-4 py-3 text-xs md:text-sm font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'executive_decision'
              ? 'border-emerald-600 text-emerald-700 font-extrabold bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>⚖️</span>
          <span>مركز التقييم والقرار التنفيذي</span>
        </button>
        <button
          onClick={() => setActiveTab('monitoring_timeline')}
          className={`px-4 py-3 text-xs md:text-sm font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'monitoring_timeline'
              ? 'border-emerald-600 text-emerald-700 font-extrabold bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>📋</span>
          <span>السجل الزمني للمتابعة ({initiative.monitoringTimeline?.length || 0})</span>
        </button>
        <button
          onClick={() => setActiveTab('pathways')}
          className={`px-4 py-3 text-xs md:text-sm font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
            activeTab === 'pathways'
              ? 'border-emerald-600 text-emerald-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          🗂️ المسارات الخمسة للتفعيل
        </button>
        <button
          onClick={() => setActiveTab('contributions')}
          className={`px-4 py-3 text-xs md:text-sm font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
            activeTab === 'contributions'
              ? 'border-emerald-600 text-emerald-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          💰 المساهمات المجتمعية الذاتية ({initiative.contributions.length})
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-3 text-xs md:text-sm font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
            activeTab === 'materials'
              ? 'border-emerald-600 text-emerald-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📦 موقف المواد والعهد الميدانية ({initiative.materials.length})
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={`px-4 py-3 text-xs md:text-sm font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
            activeTab === 'media'
              ? 'border-emerald-600 text-emerald-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📢 الإعلام والتحشيد المجتمعي
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-3 text-xs md:text-sm font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
            activeTab === 'reports'
              ? 'border-emerald-600 text-emerald-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          🔎 تقارير الرقابة والمطابقة ({initiative.reports.length})
        </button>
        <button
          onClick={() => setActiveTab('committee')}
          className={`px-4 py-3 text-xs md:text-sm font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
            activeTab === 'committee'
              ? 'border-emerald-600 text-emerald-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          👥 لجان المبادرة والفرسان ({initiative.committee.length})
        </button>
      </div>

      {/* --- Tab Contents --- */}

      {/* 0. Executive Decision Center Tab */}
      {activeTab === 'executive_decision' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Action Bar */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-1">
              <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">مركز القيادة والتوجيه التنموي</span>
              <h2 className="text-lg font-black flex items-center gap-2">
                <span>⚖️</span>
                <span>التقييم الفني والقرار التنفيذي للمبادرة</span>
              </h2>
              <p className="text-xs text-slate-300">
                ربط نتائج المتابعة الميدانية بالقرارات التنفيذية وتحديد الأولويات والجهات المسؤولة عن التدخل.
              </p>
            </div>
            {hasPermission(role, 'canClassifyStatus') && !isEditingDecision && (
              <button
                onClick={handleStartEditDecision}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl border border-emerald-500 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
                تعديل القرار والتقييم الميداني
              </button>
            )}
          </div>

          {/* EDIT FORM MODE */}
          {isEditingDecision ? (
            <div className="bg-white border-2 border-emerald-500/80 rounded-2xl p-6 space-y-6 shadow-md animate-fadeIn">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-sm font-black text-slate-900">تحديث بيانات التقييم والقرار التنفيذي</h3>
                <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg font-bold">نموذج الإدخال المعتمد</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">مرحلة دورة الحياة التشغيلية</label>
                  <select
                    value={editLifecycleStage}
                    onChange={(e) => setEditLifecycleStage(e.target.value as InitiativeLifecycleStage)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                  >
                    <option value="approved">1. المبادرة المعتمدة</option>
                    <option value="current_monitoring">2. المتابعة الحالية</option>
                    <option value="field_evaluation">3. التقييم الميداني</option>
                    <option value="status_classification">4. تصنيف الحالة</option>
                    <option value="decision_determination">5. تحديد القرار</option>
                    <option value="action_execution">6. تنفيذ الإجراء</option>
                    <option value="impact_followup">7. قياس النتائج</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">تصنيف مسار القرار الفني</label>
                  <select
                    value={editDecisionCategory}
                    onChange={(e) => setEditDecisionCategory(e.target.value as InitiativeDecisionCategory)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                  >
                    <option value="ready_for_completion">جاهزة لاستكمال التنفيذ</option>
                    <option value="needs_treatment">تحتاج معالجة (صرف دعم / مناقلة / تدخل كادر)</option>
                    <option value="stagnant_needs_decision">متعثرة تحتاج قرار حاسم</option>
                    <option value="ongoing_needs_monitoring">مستمرة تحتاج متابعة دورية</option>
                    <option value="completed_needs_closing">منجزة تحتاج إغلاق وتوثيق أثر</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">مستوى الجاهزية الميدانية</label>
                  <select
                    value={editReadinessLevel}
                    onChange={(e) => setEditReadinessLevel(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                  >
                    <option value="high">عالي (جاهزية ممتازة للتنفيذ والاستكمال)</option>
                    <option value="medium">متوسط (جاهزية مقبولة مع بعض التعديلات)</option>
                    <option value="low">منخفض (جاهزية ضعيفة بحاجة لتدخل)</option>
                    <option value="not_ready">غير جاهز (وجود معوقات جوهرية)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">أولوية التدخل التنفيذي</label>
                  <select
                    value={editInterventionPriority}
                    onChange={(e) => setEditInterventionPriority(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                  >
                    <option value="urgent">🔥 عاجل جداً (تدخل فوري خلال 3 أيام)</option>
                    <option value="medium">⚠️ متوسط (تدخل خلال أسابيع)</option>
                    <option value="routine">🟢 عادي (متابعة روتينية مستمرة)</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">الإجراء التنفيذي المطلوب اتخاذه</label>
                  <input
                    type="text"
                    value={editRequiredAction}
                    onChange={(e) => setEditRequiredAction(e.target.value)}
                    placeholder="مثال: صرف الدفعة المتبقية من الأسمنت مع إرسال كمبريسر تكسير أحجار"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">الجهة المسؤولة عن التنفيذ</label>
                  <input
                    type="text"
                    value={editResponsibleEntity}
                    onChange={(e) => setEditResponsibleEntity(e.target.value)}
                    placeholder="مثال: وحدة التدخلات والسلطة المحلية بالمديرية"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">تاريخ المتابعة القادمة</label>
                  <input
                    type="date"
                    value={editNextFollowUpDate}
                    onChange={(e) => setEditNextFollowUpDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">أسباب التأخر والتعثر الميداني (سطر لكل سبب)</label>
                  <textarea
                    rows={3}
                    value={editDelayReasonsText}
                    onChange={(e) => setEditDelayReasonsText(e.target.value)}
                    placeholder="تأخر صرف دفعة المواد...&#10;شح الوقود..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">المعوقات والتحديات (سطر لكل معوق)</label>
                  <textarea
                    rows={3}
                    value={editObstaclesText}
                    onChange={(e) => setEditObstaclesText(e.target.value)}
                    placeholder="صلابة الصخور بالموقع...&#10;توقف المساهمة النقدية..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">الاحتياجات المطلوبة للاستكمال (سطر لكل احتياج)</label>
                  <textarea
                    rows={3}
                    value={editRequiredNeedsText}
                    onChange={(e) => setEditRequiredNeedsText(e.target.value)}
                    placeholder="صرف 200 كيس إسمنت تعزيز...&#10;نزول فريق التحكيم القبلي..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditingDecision(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveExecutiveDecision}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  حفظ وتثبيت القرار التنفيذي
                </button>
              </div>
            </div>
          ) : (
            /* VIEW MODE: Executive Decision & Evaluation Display */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 1: Technical & Field Evaluation */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">📋</span>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">نتائج التقييم الفني والميداني</h3>
                      <p className="text-[10px] text-slate-500">الجاهزية، العقبات، المسببات، والاحتياجات</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                    initiative.evaluation?.readinessLevel === 'high' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    initiative.evaluation?.readinessLevel === 'medium' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                    initiative.evaluation?.readinessLevel === 'low' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                    'bg-rose-50 text-rose-800 border-rose-200'
                  }`}>
                    الجاهزية: {
                      initiative.evaluation?.readinessLevel === 'high' ? 'عالية (جاهزية ممتازة)' :
                      initiative.evaluation?.readinessLevel === 'medium' ? 'متوسطة' :
                      initiative.evaluation?.readinessLevel === 'low' ? 'منخفضة (حاجة لتدخل)' : 'غير جاهز'
                    }
                  </span>
                </div>

                {/* Decision Category Tag */}
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block">مسار التصنيف التنفيذي:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">
                      {
                        initiative.decisionCategory === 'ready_for_completion' ? '✅ جاهزة لاستكمال التنفيذ' :
                        initiative.decisionCategory === 'needs_treatment' ? '🛠️ تحتاج معالجة (دعم/مناقلة/تدخل)' :
                        initiative.decisionCategory === 'stagnant_needs_decision' ? '🚨 متعثرة تحتاج قرار حاسم' :
                        initiative.decisionCategory === 'completed_needs_closing' ? '🏆 منجزة تحتاج إغلاق وتوثيق' : '🚧 مستمرة تحتاج متابعة دورية'
                      }
                    </span>
                  </div>
                </div>

                {/* Delay Reasons */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-black text-rose-900 flex items-center gap-1">
                    <span>⚠️</span>
                    <span>أسباب التأخر والتعثر الميداني:</span>
                  </h4>
                  {initiative.evaluation?.delayReasons && initiative.evaluation.delayReasons.length > 0 ? (
                    <ul className="space-y-1 pr-2">
                      {initiative.evaluation.delayReasons.map((r, i) => (
                        <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                          <span className="text-rose-500 font-bold">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic">لا توجد مسببات تأخر مسجلة.</p>
                  )}
                </div>

                {/* Obstacles */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-black text-amber-900 flex items-center gap-1">
                    <span>🧱</span>
                    <span>المعوقات والتحديات الإدارية واللوجستية:</span>
                  </h4>
                  {initiative.evaluation?.obstacles && initiative.evaluation.obstacles.length > 0 ? (
                    <ul className="space-y-1 pr-2">
                      {initiative.evaluation.obstacles.map((o, i) => (
                        <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic">لا توجد معوقات بارزة حالياً.</p>
                  )}
                </div>

                {/* Required Needs */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-black text-emerald-900 flex items-center gap-1">
                    <span>💡</span>
                    <span>الاحتياجات المطلوبة لاستكمال المبادرة:</span>
                  </h4>
                  {initiative.evaluation?.requiredNeeds && initiative.evaluation.requiredNeeds.length > 0 ? (
                    <ul className="space-y-1 pr-2">
                      {initiative.evaluation.requiredNeeds.map((n, i) => (
                        <li key={i} className="text-xs text-emerald-900 bg-emerald-50/60 p-2 rounded-lg font-bold flex items-start gap-1.5 border border-emerald-100">
                          <span className="text-emerald-600">✓</span>
                          <span>{n}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic">لا توجد احتياجات إضافية مطلوبة.</p>
                  )}
                </div>
              </div>

              {/* Card 2: Executive Decision & Accountability */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">⚖️</span>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">القرار التنفيذي والمسؤولية</h3>
                      <p className="text-[10px] text-slate-500">التوجيه المعتمد والجهة المسؤولة والموعد المحدد</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${
                    initiative.executiveDecision?.interventionPriority === 'urgent' ? 'bg-rose-100 text-rose-900 border-rose-300 animate-pulse' :
                    initiative.executiveDecision?.interventionPriority === 'medium' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                    'bg-emerald-100 text-emerald-900 border-emerald-300'
                  }`}>
                    الأولوية: {
                      initiative.executiveDecision?.interventionPriority === 'urgent' ? '🔥 عاجل جداً' :
                      initiative.executiveDecision?.interventionPriority === 'medium' ? '⚠️ متوسط' : '🟢 عادي'
                    }
                  </span>
                </div>

                {/* Required Action */}
                <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-1">
                  <span className="text-[10px] text-indigo-700 font-extrabold uppercase tracking-wider block">الإجراء المطلوب اتخاذه:</span>
                  <p className="text-xs font-black text-indigo-950 leading-relaxed">
                    {initiative.executiveDecision?.requiredAction || 'متابعة المبادرة ميدانياً والتأكد من مطابقة أعمال الصب.'}
                  </p>
                </div>

                {/* Responsible Entity */}
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block">الجهة المسؤولة عن التنفيذ:</span>
                  <p className="text-xs font-black text-slate-900">
                    🏢 {initiative.executiveDecision?.responsibleEntity || 'وحدة التدخلات والسلطة المحلية'}
                  </p>
                </div>

                {/* Next Follow-Up Date & Decision Maker */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                    <span className="text-[10px] text-emerald-800 font-bold block">📅 موعد المتابعة القادمة:</span>
                    <span className="text-xs font-black text-emerald-900 block mt-0.5">
                      {initiative.executiveDecision?.nextFollowUpDate || 'غير محدد'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <span className="text-[10px] text-slate-500 font-bold block">✍️ جهة إصدار القرار:</span>
                    <span className="text-xs font-black text-slate-800 block mt-0.5">
                      {initiative.executiveDecision?.decisionMaker || 'قيادة وحدة التدخلات'}
                    </span>
                  </div>
                </div>

                {/* Summary status tag */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>تاريخ الصدور: <strong className="text-slate-800 font-mono">{initiative.executiveDecision?.decisionDate || initiative.createdAt}</strong></span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold text-[10px] border border-emerald-200">
                    حالة القرار: {initiative.executiveDecision?.executionStatus === 'executed' ? 'تم التنفيذ بالكامل ✓' : 'قيد المتابعة والتنفيذ 🚀'}
                  </span>
                </div>

                {/* Executive Action Buttons */}
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <span className="text-[10px] text-amber-800 font-black block">⚡ إصدار وتأكيد التوجيه القيادي المباشر:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => {
                        setActiveActionType('approve');
                        setActiveDecisionModal(true);
                      }}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition-all cursor-pointer shadow-xs text-center"
                    >
                      اعتماد ✅
                    </button>
                    <button
                      onClick={() => {
                        setActiveActionType('direct');
                        setActiveDecisionModal(true);
                      }}
                      className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl text-xs transition-all cursor-pointer shadow-xs text-center"
                    >
                      توجيه 💬
                    </button>
                    <button
                      onClick={() => {
                        setActiveActionType('refer');
                        setActiveDecisionModal(true);
                      }}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs transition-all cursor-pointer shadow-xs text-center"
                    >
                      إحالة ↗️
                    </button>
                    <button
                      onClick={() => {
                        setActiveActionType('followup');
                        setActiveDecisionModal(true);
                      }}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white font-black rounded-xl text-xs transition-all cursor-pointer shadow-xs text-center"
                    >
                      متابعة 🔍
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 0.5 Periodic Monitoring Timeline Audit Log Tab */}
      {activeTab === 'monitoring_timeline' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Bar */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-1">
              <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">سجل التتبع والمتابعة الميدانية</span>
              <h2 className="text-lg font-black flex items-center gap-2">
                <span>📋</span>
                <span>السجل الزمني للمتابعة الدورية والميدانية</span>
              </h2>
              <p className="text-xs text-slate-300">
                توثيق زمني لكل مراحل النزول والمتابعة والإجراءات المتخذة ومستوى التقدم الفني.
              </p>
            </div>
            {hasPermission(role, 'canClassifyStatus') && (
              <button
                onClick={() => setShowAddLogModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl border border-emerald-500 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                تسجيل متابعة دورية جديدة
              </button>
            )}
          </div>

          {/* ADD LOG MODAL */}
          {showAddLogModal && (
            <div className="bg-white border-2 border-emerald-500 rounded-2xl p-6 space-y-4 shadow-lg animate-fadeIn">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-sm font-black text-slate-900">إضافة مدخل متابعة ميدانية جديد</h3>
                <button
                  type="button"
                  onClick={() => setShowAddLogModal(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  إغلاق ✕
                </button>
              </div>

              <form onSubmit={handleAddMonitoringLog} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">حالة المبادرة بالنزول الحالي</label>
                    <input
                      type="text"
                      value={newLogStatus}
                      onChange={(e) => setNewLogStatus(e.target.value)}
                      placeholder="مثال: قيد التنفيذ النشط / متوقف مؤقتاً"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">نسبة التقدم الفني الفعلي %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={newLogProgress}
                      onChange={(e) => setNewLogProgress(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold font-mono text-slate-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">الجهة / الشخص المسؤول عن النزول</label>
                    <input
                      type="text"
                      value={newLogResponsible}
                      onChange={(e) => setNewLogResponsible(e.target.value)}
                      placeholder="مثال: المشرف الهندسي وفرسان التنمية"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">الإجراء الميداني المتخذ</label>
                  <input
                    type="text"
                    value={newLogAction}
                    onChange={(e) => setNewLogAction(e.target.value)}
                    placeholder="مثال: استكمال صب مقطع 50 متراً وتأمين رش الماء بالموقع"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">ملاحظات ونتائج المتابعة الدورية</label>
                  <textarea
                    rows={3}
                    value={newLogNotes}
                    onChange={(e) => setNewLogNotes(e.target.value)}
                    placeholder="اكتب التقييم والملاحظات التفصيلية للنزول الميداني..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddLogModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    حفظ السجل الميداني
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TIMELINE LIST */}
          <div className="space-y-4">
            {initiative.monitoringTimeline && initiative.monitoringTimeline.length > 0 ? (
              <div className="relative border-r-2 border-emerald-500 pr-6 space-y-6 my-4 mr-3">
                {initiative.monitoringTimeline.map((log, idx) => (
                  <div key={log.id || idx} className="relative bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-2">
                    {/* Circle Node on Timeline */}
                    <span className="absolute -right-[31px] top-6 w-4 h-4 bg-emerald-600 rounded-full border-2 border-white shadow-xs"></span>

                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                          📅 {log.date}
                        </span>
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                          {log.projectStatus}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-700 bg-slate-50 px-2.5 py-0.5 rounded-lg border border-slate-200 font-mono">
                          نسبة الإنجاز: {log.progressRate}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                        <span>🚀 الإجراء المتخذ:</span>
                        <span>{log.actionTaken}</span>
                      </h4>
                      <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl leading-relaxed border border-slate-100 mt-2">
                        💡 {log.notes}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-100">
                      <span>الجهة المسؤولة: <strong className="text-slate-800">{log.responsiblePerson}</strong></span>
                      {log.createdRole && (
                        <span className="text-slate-400">دور المسجل: {log.createdRole}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center space-y-2">
                <span className="text-2xl block">📋</span>
                <p className="text-xs font-bold text-slate-600">لم يتم تسجيل أي متابعة ميدانية دورية لهذه المبادرة بعد.</p>
                <p className="text-[11px] text-slate-400">يمكنك النقر على زر "تسجيل متابعة دورية جديدة" لتدوين نتائج أول نزول ميداني.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1. Pathways and Tasks Checklist */}
      {activeTab === 'pathways' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fadeIn">
          {/* Pathway selection panel */}
          <div className="lg:col-span-4 space-y-2">
            <span className="text-xs font-bold text-slate-400 block mb-1">اختر المسار لتفعيل مهامه:</span>
            {initiative.pathways.map(p => {
              const comp = p.tasks.filter(t => t.completed).length;
              const total = p.tasks.length;
              const isSelected = selectedPathwayId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPathwayId(p.id)}
                  className={`w-full text-right p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    {getPathwayIcon(p.icon)}
                  </div>
                  <div className="space-y-1 w-full">
                    <span className={`text-[10px] font-bold block ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`}>
                      المسار {p.id}
                    </span>
                    <h4 className="text-xs font-bold leading-tight line-clamp-1">{p.title.split(':')[1] || p.title}</h4>
                    <span className={`text-[10px] font-medium block ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                      {comp} من أصل {total} مهام مكتملة
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Pathway Tasks & Details Workspace */}
          <div className="lg:col-span-8 space-y-4">
            {(() => {
              const currentPathway = initiative.pathways.find(p => p.id === selectedPathwayId);
              if (!currentPathway) return null;

              return (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                      {getPathwayIcon(currentPathway.icon)}
                    </div>
                    <div className="flex-1">
                      <h2 className="font-bold text-slate-950 text-base">{currentPathway.title}</h2>
                      <p className="text-xs text-slate-500 mt-0.5">{currentPathway.subtitle}</p>
                    </div>
                  </div>

                  {/* Connected Operational Portal Shortcuts for Current Pathway */}
                  {onNavigateTab && (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1.5 text-emerald-800">
                          <Activity className="w-3.5 h-3.5 text-emerald-600" />
                          الأدوات والبوابات التشغيلية المرتبطة بالمسار {currentPathway.id}:
                        </span>
                        <span className="text-[10px] text-slate-500 font-normal">الانتقال المباشر مع حفظ السياق</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {currentPathway.id === 1 && (
                          <>
                            <button
                              onClick={() => onNavigateTab('engineers_portal', initiative.id, 1)}
                              className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition-all shadow-3xs cursor-pointer flex items-center gap-1"
                            >
                              <span>👷 استمارة وتقارير المهندسين</span>
                            </button>
                            <button
                              onClick={() => onNavigateTab('field_staging', initiative.id, 1)}
                              className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition-all shadow-3xs cursor-pointer flex items-center gap-1"
                            >
                              <span>🏗️ الرفع الميداني والفرز</span>
                            </button>
                            <button
                              onClick={() => onNavigateTab('matching_results', initiative.id, 1)}
                              className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-rose-800 border border-rose-300 rounded-lg text-xs font-bold transition-all shadow-3xs cursor-pointer flex items-center gap-1"
                            >
                              <span>🎯 الفرز والمطابقة المكتبية</span>
                            </button>
                          </>
                        )}
                        {currentPathway.id === 2 && (
                          <>
                            <button
                              onClick={() => onNavigateTab('activation_plan', initiative.id, 2)}
                              className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-indigo-800 border border-indigo-300 rounded-lg text-xs font-bold transition-all shadow-3xs cursor-pointer flex items-center gap-1"
                            >
                              <span>📘 مرجع وخطة التفعيل التنموي</span>
                            </button>
                            <button
                              onClick={() => onNavigateTab('workshop', initiative.id, 2)}
                              className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition-all shadow-3xs cursor-pointer flex items-center gap-1"
                            >
                              <span>👥 ورشة العمل ومحاكاة الشركاء</span>
                            </button>
                          </>
                        )}
                        {currentPathway.id === 3 && (
                          <>
                            <button
                              onClick={() => setActiveTab('materials')}
                              className="px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-all shadow-3xs cursor-pointer flex items-center gap-1"
                            >
                              <span>📦 موقف المواد والعهد الميدانية</span>
                            </button>
                            <button
                              onClick={() => onNavigateTab('matrix', initiative.id, 3)}
                              className="px-3 py-1.5 bg-white hover:bg-sky-50 text-sky-900 border border-sky-300 rounded-lg text-xs font-bold transition-all shadow-3xs cursor-pointer flex items-center gap-1"
                            >
                              <span>📊 مصفوفة الكميات ومقارنة الأسمنت</span>
                            </button>
                          </>
                        )}
                        {currentPathway.id === 4 && (
                          <>
                            <button
                              onClick={() => onNavigateTab('tracking_sheet', initiative.id, 4)}
                              className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition-all shadow-3xs cursor-pointer flex items-center gap-1"
                            >
                              <span>📊 شيت المتابعة ودليل الفرسان</span>
                            </button>
                            <button
                              onClick={() => setActiveTab('contributions')}
                              className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition-all shadow-3xs cursor-pointer flex items-center gap-1"
                            >
                              <span>💰 سجل المساهمات المجتمعية</span>
                            </button>
                            <button
                              onClick={() => setActiveTab('media')}
                              className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-indigo-800 border border-indigo-300 rounded-lg text-xs font-bold transition-all shadow-3xs cursor-pointer flex items-center gap-1"
                            >
                              <span>📢 التحشيد والإعلام التنموي</span>
                            </button>
                          </>
                        )}
                        {currentPathway.id === 5 && (
                          <>
                            <button
                              onClick={() => onNavigateTab('periodic_reports', initiative.id, 5)}
                              className="px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-all shadow-3xs cursor-pointer flex items-center gap-1"
                            >
                              <span>📑 التقارير والزيارات الدورية</span>
                            </button>
                            <button
                              onClick={() => onNavigateTab('matrix', initiative.id, 5)}
                              className="px-3 py-1.5 bg-white hover:bg-sky-50 text-sky-900 border border-sky-300 rounded-lg text-xs font-bold transition-all shadow-3xs cursor-pointer flex items-center gap-1"
                            >
                              <span>⚖️ مصفوفة النتائج ومطابقة الإنجاز</span>
                            </button>
                            <button
                              onClick={() => onNavigateTab('decision_center', initiative.id, 5)}
                              className="px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-900 border border-indigo-300 rounded-lg text-xs font-bold transition-all shadow-3xs cursor-pointer flex items-center gap-1"
                            >
                              <span>🧠 مركز اتخاذ القرار التنموي</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {currentPathway.tasks.map((task) => {
                      return (
                        <div
                          key={task.id}
                          className={`p-4 rounded-xl border transition-all ${
                            task.completed
                              ? 'bg-emerald-50/20 border-emerald-200'
                              : 'bg-slate-50/50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <label className={`flex items-start gap-3 select-none ${role === 'visitor' ? 'cursor-default' : 'cursor-pointer'}`}>
                              <input
                                type="checkbox"
                                checked={task.completed}
                                disabled={role === 'visitor'}
                                onChange={() => handleToggleTask(currentPathway.id, task.id)}
                                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-1 disabled:opacity-75"
                              />
                              <div>
                                <span className={`text-xs font-bold block ${task.completed ? 'text-emerald-950 line-through' : 'text-slate-900'}`}>
                                  {task.title}
                                </span>
                                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{task.description}</p>
                              </div>
                            </label>

                            {task.completed && task.completedAt && (
                              <span className="text-[10px] text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded font-semibold shrink-0">
                                تم التفعيل: {task.completedAt}
                              </span>
                            )}
                          </div>

                          {/* Notes field for each task */}
                          <div className="mt-3 pt-3 border-t border-dashed border-slate-200/60 flex flex-col md:flex-row md:items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-500 shrink-0">مستند الإثبات / ملاحظة ميدانية:</span>
                            <input
                              type="text"
                              value={task.notes || ''}
                              disabled={role === 'visitor'}
                              onChange={(e) => handleUpdateTaskNotes(currentPathway.id, task.id, e.target.value)}
                              placeholder={role === 'visitor' ? "لا توجد ملاحظات من المشرف" : "مثال: رقم محضر الاستلام أو تاريخ النزول..."}
                              className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 2. Community Contributions Tab */}
      {activeTab === 'contributions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fadeIn">
          {/* Add/Edit contribution form */}
          {role !== 'visitor' && (
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Coins className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-950 text-sm">
                  {editingContribId ? '📝 تعديل مساهمة مجتمعية موثقة' : 'توثيق مساهمة مجتمعية جديدة'}
                </h3>
              </div>
              <form onSubmit={handleAddContribution} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600">اسم المانح / الجهة المساهمة</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أهالي قرية وادي الضباب"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600">نوع المساهمة الذاتية</label>
                  <select
                    value={contribType}
                    onChange={(e) => setContribType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    <option value="cash">💵 مساهمة مالية نقدية</option>
                    <option value="inkind_material">🧱 مساهمة عينية (أحجار، إسمنت، مواد)</option>
                    <option value="inkind_labor">👷 مساهمة عينية (عمالة متطوعة، معدات)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600">القيمة المقدرة بالريال اليمني</label>
                  <input
                    type="number"
                    required
                    placeholder="مثال: 500000"
                    value={contribVal || ''}
                    onChange={(e) => setContribVal(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 block">يجب تقدير القيمة النقدية للخدمة العينية لتقييم النتائج بدقة.</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600">وصف دقيق للمساهمة</label>
                  <textarea
                    placeholder="مثال: التبرع بـ 50 كيس إسمنت أو توفير جرافة حفر لمدة يومين..."
                    value={contribDesc}
                    onChange={(e) => setContribDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 min-h-[60px]"
                  />
                </div>

                <div className="flex gap-2">
                  {editingContribId && (
                    <button
                      type="button"
                      onClick={handleCancelEditContribution}
                      className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-lg transition-colors cursor-pointer"
                    >
                      إلغاء
                    </button>
                  )}
                  <button
                    type="submit"
                    className={`font-bold text-xs py-2.5 rounded-lg transition-colors cursor-pointer ${
                      editingContribId 
                        ? 'w-2/3 bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'w-full bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {editingContribId ? 'تحديث المساهمة الموثقة' : 'حفظ وتوثيق المساهمة في الميدان'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Contributions ledger */}
          <div className={`${role === 'visitor' ? 'lg:col-span-12' : 'lg:col-span-7'} bg-white border border-slate-200 rounded-2xl p-5 space-y-4`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-950 text-sm">دفتر المساهمات المجتمعية والتمويل الذاتي</h3>
                <p className="text-[11px] text-slate-400">إجمالي مساهمة المواطنين الموثقة في هذا المشروع</p>
              </div>
              <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
                {totalContValue.toLocaleString('ar-YE')} ريال
              </span>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {initiative.contributions.length > 0 ? (
                initiative.contributions.map((c) => {
                  const isBeingEdited = editingContribId === c.id;
                  return (
                    <div 
                      key={c.id} 
                      className={`p-3 border rounded-xl flex items-start justify-between gap-3 transition-colors ${
                        isBeingEdited 
                          ? 'bg-blue-50/70 border-blue-200 ring-2 ring-blue-100' 
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{role === 'visitor' ? 'مساهم مجتمعي (فاعل خير)' : c.donorName}</span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                            c.type === 'cash' ? 'bg-emerald-100 text-emerald-800' :
                            c.type === 'inkind_material' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                          }`}>
                            {c.type === 'cash' ? 'نقدي' : c.type === 'inkind_material' ? 'عيني مواد' : 'عيني عمل'}
                          </span>
                          {isBeingEdited && (
                            <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded animate-pulse">
                              قيد التعديل الآن
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{c.description}</p>
                        <span className="text-[10px] text-slate-400 block">تاريخ التوثيق: {c.date}</span>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-xs font-black text-slate-800">+{c.value.toLocaleString('ar-YE')} ريال</span>
                        {role !== 'visitor' && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleStartEditContribution(c)}
                              className={`p-1 rounded transition-colors ${
                                isBeingEdited 
                                  ? 'text-blue-600 bg-blue-100' 
                                  : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                              }`}
                              title="تعديل المساهمة"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteContribution(c.id)}
                              className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                              title="حذف المساهمة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs">
                  لم تسجل أي مساهمة عينية أو نقدية بعد. يرجى توثيق المساهمات من النموذج المجاور.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Storage and Materials Inventory / Custody / Transfers Tab */}
      {activeTab === 'materials' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Executive Materials Position Card */}
          <MaterialsPositionCard
            initiative={initiative}
            onUpdateInitiative={onUpdate}
            role={role}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Add Material to inventory form */}
          {role !== 'visitor' && (
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Truck className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-slate-950 text-sm">تسجيل وتوريد المواد في الميدان</h3>
            </div>
            <form onSubmit={handleAddMaterial} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">اسم المادة الموردة</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: إسمنت مقاوم، حديد 10 ملم، أنابيب بلاستيك"
                  value={matName}
                  onChange={(e) => setMatName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600">الكمية</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={matQty || ''}
                    onChange={(e) => setMatQty(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600">الوحدة</label>
                  <input
                    type="text"
                    required
                    placeholder="كيس، طن، لفة، شاحنة"
                    value={matUnit}
                    onChange={(e) => setMatUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">موقع التخزين الميداني الحالي</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مخزن مدرسة القرية أو بيت الشيخ صالح"
                  value={matLoc}
                  onChange={(e) => setMatLoc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">حالة الأمن الفني للتخزين</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-emerald-700">
                    <input
                      type="radio"
                      name="matStatus"
                      checked={matStatus === 'safe'}
                      onChange={() => setMatStatus('safe')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    آمنة ومخزنة فنياً بشكل سليم
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-rose-700">
                    <input
                      type="radio"
                      name="matStatus"
                      checked={matStatus === 'at_risk'}
                      onChange={() => setMatStatus('at_risk')}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    مهددة (رطوبة، سيول، غير آمنة)
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                توثيق استلام المواد وتخزينها
              </button>
            </form>
          </div>
          )}

          {/* Materials inventory & Transfers list */}
          <div className={`${role === 'visitor' ? 'lg:col-span-12' : 'lg:col-span-7'} bg-white border border-slate-200 rounded-2xl p-5 space-y-4`}>
            <div>
              <h3 className="font-bold text-slate-950 text-sm">مراقبة سلامة المواد وجدولة المناقلات</h3>
              <p className="text-[11px] text-slate-400">
                المسار الثالث يركز على ترحيل المواد المهددة من المخازن غير الآمنة لتجنب الهدر المالي.
              </p>
            </div>

            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {initiative.materials.length > 0 ? (
                initiative.materials.map((m) => (
                  <MaterialItem
                    key={m.id}
                    material={m}
                    role={role}
                    handleTransferMaterial={handleTransferMaterial}
                  />
                ))
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs">
                  لا توجد مواد مخزنة مسجلة حالياً لهذه المبادرة. يرجى توريدها عبر النموذج المجاور.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* 4. Media Campaign Mobilization Tab */}
      {activeTab === 'media' && (
        <div className="space-y-6 animate-fadeIn" id="media-campaign-workspace">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Instructions and role explanation */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Megaphone className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-950 text-sm">أدوات التحشيد والإعلام التنموي</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                المسار الرابع يركز على دور الجمعية كممثل مجتمعي رئيسي في الإعلام. تهدف الأدوات هنا لحشد الدعم ونشر روح العطاء ومشاركة نجاحات التمويل الذاتي لإيقاظ المنافسة الإيجابية بالمديرية.
              </p>
              <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 text-xs text-sky-800 space-y-2">
                <h4 className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  <span>توجيهات الإعلام التنموي الفعال:</span>
                </h4>
                <ul className="list-disc list-inside space-y-1 text-[11px]">
                  <li>ادعُ المواطنين الميدانيين لتصوير العمل وإظهار روح الهمة.</li>
                  <li>انشر أرقام المساهمات وقصص الفرسان كقدوة مشعة.</li>
                  <li>استخدم واتساب وفيسبوك لنشر التحديثات المصورة لضمان ثقة الداعمين والشركاء.</li>
                </ul>
              </div>
            </div>

            {/* Social media post composer / copy to clipboard */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-950 text-sm">منشور التحشيد والمكاشفة المجتمعية التلقائي</h3>
                <button
                  type="button"
                  onClick={handleCopyToClipboard}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      تم نسخ المنشور بنجاح!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      نسخ المنشور للواتساب والفيسبوك
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-[220px] overflow-y-auto" dir="rtl">
                {generateMediaPostText()}
              </div>
              <p className="text-[11px] text-slate-400 text-left italic">
                * تم صياغة المنشور آلياً بمطابقة إجمالي مساهمات المجتمع وموقع المبادرة الفعلي لتعزيز الشفافية.
              </p>
            </div>
          </div>

          {/* Published Media Images & Attachments Gallery */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-extrabold text-slate-950 text-sm">المعرض الإعلامي والصور التوثيقية الجاهزة للنشر</h3>
                  <p className="text-[11px] text-slate-500">صور معتمدة تحاكي واقع المبادرات المجتمعية الميدانية ومراحل تنفيذها</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black">
                5 صور معتمدة للنشر
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden group hover:border-emerald-500 transition-all shadow-2xs">
                <div className="h-36 overflow-hidden relative">
                  <img src={imgMedia} alt="حملة التحشيد الإعلامي" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-sky-600/90 text-white text-[9px] font-black rounded-md">
                    غلاف المنشور
                  </span>
                </div>
                <div className="p-2.5 space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-xs line-clamp-1">حملة التحشيد الإعلامي</h4>
                  <p className="text-[10px] text-slate-500">صورة رئيسية لمنشورات التواصل الاجتماعي والواتساب</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden group hover:border-emerald-500 transition-all shadow-2xs">
                <div className="h-36 overflow-hidden relative">
                  <img src={imgVolunteers} alt="همة فرسان الميدان" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-600/90 text-white text-[9px] font-black rounded-md">
                    الميدان والفرسان
                  </span>
                </div>
                <div className="p-2.5 space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-xs line-clamp-1">تلاحم الفرسان والأهالي</h4>
                  <p className="text-[10px] text-slate-500">توثيق أعمال الرصف والحفر بالجهود الذاتية</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden group hover:border-emerald-500 transition-all shadow-2xs">
                <div className="h-36 overflow-hidden relative">
                  <img src={imgWarehouse} alt="تفرز المواد والمخزن" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-amber-600/90 text-white text-[9px] font-black rounded-md">
                    الشفافية والمخازن
                  </span>
                </div>
                <div className="p-2.5 space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-xs line-clamp-1">وصول وتوثيق المواد</h4>
                  <p className="text-[10px] text-slate-500">استلام ومطابقة كميات الأسمنت والديزل بالمخزن</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden group hover:border-emerald-500 transition-all shadow-2xs">
                <div className="h-36 overflow-hidden relative">
                  <img src={imgQuality} alt="المطابقة الهندسية والجودة" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-indigo-600/90 text-white text-[9px] font-black rounded-md">
                    الجودة الفنية
                  </span>
                </div>
                <div className="p-2.5 space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-xs line-clamp-1">المطابقة والجودة</h4>
                  <p className="text-[10px] text-slate-500">فحص الخرسانات والمواصفات المعيارية الميدانية</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden group hover:border-emerald-500 transition-all shadow-2xs">
                <div className="h-36 overflow-hidden relative">
                  <img src={imgSurvey} alt="الدراسة المسحية للموقع" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-slate-700/90 text-white text-[9px] font-black rounded-md">
                    المسح والتقييم
                  </span>
                </div>
                <div className="p-2.5 space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-xs line-clamp-1">الدراسة المسحية والموقع</h4>
                  <p className="text-[10px] text-slate-500">تحديد المسار والاحتياج الهندسي المسبق</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Field Audit, Verification & Reports Tab */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fadeIn" id="reports-audit-workspace">
          {/* Create Field Report Form (Pathway 5) */}
          {role !== 'visitor' && (
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ClipboardCheck className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-slate-950 text-sm">إعداد ومطابقة تقرير ميداني جديد بالنتائج</h3>
            </div>
            <form onSubmit={handleCreateReport} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">عنوان تقرير المطابقة الفنية</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تقرير مطابقة أعمال الرصف ومراجعة مخازن الإسمنت"
                  value={repTitle}
                  onChange={(e) => setRepTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">الفرز والتحقق ومطابقة الصور الميدانية</label>
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                  <input
                    type="checkbox"
                    checked={repMatched}
                    onChange={(e) => setRepMatched(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-slate-700 leading-snug">
                    مطابقة معطيات الإنجاز الفعلي على الواقع مع الفرز المكتبي والصور المرفوعة من الممثل
                  </span>
                </label>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">خلفية المبادرة لمطابقة الصور</label>
                <select
                  value={repTheme}
                  onChange={(e) => setRepTheme(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-rose-500 font-semibold"
                >
                  <option value="road_paving">🚧 رصف وركام طرق جبلية</option>
                  <option value="retaining_wall">🧱 جدران ساندة وحواجز أتربة</option>
                  <option value="water_basin">💧 خزان تجميع مياه أمطار وشبكات</option>
                  <option value="school_repair">🏫 ترميم فصول وتأهيل مدارس</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">الوصف الميداني المفصل للتدقيق والنتائج</label>
                <textarea
                  required
                  placeholder="اكتب التقييم التفصيلي: المساحة المنجزة بالمتر المربع أو الطولي، وتطابق استهلاك الإسمنت ومحاضر الاستلام..."
                  value={repDesc}
                  onChange={(e) => setRepDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-rose-500 min-h-[80px]"
                />
              </div>

              {/* Achievements add */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600">أبرز منجزات المبادرة حتى اليوم</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="مثال: رصف 150 متر طولي بالكامل"
                    value={repAchievement}
                    onChange={(e) => setRepAchievement(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddAchievementToList}
                    className="px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    أضف
                  </button>
                </div>
                {repAchievementsList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {repAchievementsList.map((ach, idx) => (
                      <span key={idx} className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-100">
                        ✓ {ach}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Challenges add */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600">التحديات والعراقيل الميدانية القائمة</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="مثال: صعوبة وصول سيارات نقل المياه"
                    value={repChallenge}
                    onChange={(e) => setRepChallenge(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddChallengeToList}
                    className="px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    أضف
                  </button>
                </div>
                {repChallengesList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {repChallengesList.map((ch, idx) => (
                      <span key={idx} className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-100">
                        ⚠ {ch}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                تثبيت وإرسال تقرير المطابقة والمكاشفة
              </button>
            </form>
          </div>
          )}

          {/* Verification reports and photos catalog */}
          <div className={`${role === 'visitor' ? 'lg:col-span-12' : 'lg:col-span-7'} bg-white border border-slate-200 rounded-2xl p-5 space-y-4`}>
            <div>
              <h3 className="font-bold text-slate-950 text-sm">تقارير الرقابة والمطابقة بالنتائج المعتمدة</h3>
              <p className="text-[11px] text-slate-400">
                مطابقة البيانات الميدانية والصور لضمان عدم وجود تلاعب وتفعيل الرقابة المستمرة.
              </p>
            </div>

            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
              {initiative.reports.length > 0 ? (
                initiative.reports.map((r) => {
                  return (
                    <div key={r.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                        <div>
                          <h4 className="font-bold text-slate-950 text-xs">{r.title}</h4>
                          <span className="text-[10px] text-slate-400">تاريخ التقرير الميداني: {r.date}</span>
                        </div>
                        <div className="flex gap-2">
                          {r.isMatchedWithDeskReview ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              مطابق مكتبي وميداني
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded border border-amber-200 animate-pulse">
                              <AlertTriangle className="w-3 h-3" />
                              بانتظار تدقيق إضافي
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-700 leading-relaxed font-medium">{r.description}</p>

                      {/* Achievements/Challenges bullets */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-200">
                        <div>
                          <span className="text-[10px] font-black text-emerald-800 block mb-1">المنجزات الفنية:</span>
                          <ul className="list-disc list-inside space-y-1 text-[10px] text-slate-600">
                            {r.achievements.map((ach, idx) => <li key={idx}>{ach}</li>)}
                          </ul>
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-rose-800 block mb-1">التحديات المتبقية:</span>
                          <ul className="list-disc list-inside space-y-1 text-[10px] text-slate-600">
                            {r.challenges.map((ch, idx) => <li key={idx}>{ch}</li>)}
                          </ul>
                        </div>
                      </div>

                      {/* Simulated Match photo rendering for Path 5 (صور الإنجاز) */}
                      <div className="space-y-1.5 pt-1.5">
                        <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5 text-slate-400" />
                          صورة الإنجاز الميدانية الموثقة (المطابقة):
                        </span>
                        <div className="relative rounded-xl overflow-hidden bg-slate-950 h-32 flex items-center justify-center text-slate-400 text-xs font-bold shadow-inner">
                          {r.imagePlaceholder === 'road_paving' ? (
                            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/90 to-emerald-950/20 flex flex-col justify-end p-3">
                              <span className="text-white text-xs font-bold">🚧 أعمال رصف طريق الجشاعة بمحافظة إب</span>
                              <span className="text-[10px] text-slate-300">مطابقة صور الإنجاز ميدانياً مع المهندس المشرف - محافظة إب</span>
                            </div>
                          ) : r.imagePlaceholder === 'retaining_wall' ? (
                            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/90 to-blue-950/20 flex flex-col justify-end p-3">
                              <span className="text-white text-xs font-bold">🧱 جدار حماية الأراضي الزراعية بالوادي</span>
                              <span className="text-[10px] text-slate-300">مطابقة الفرز المكتبي والصور والتحقق النهائي</span>
                            </div>
                          ) : r.imagePlaceholder === 'water_basin' ? (
                            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/90 to-sky-950/20 flex flex-col justify-end p-3">
                              <span className="text-white text-xs font-bold">💧 تأهيل وصيانة الخزان الميداني المجتمعي</span>
                              <span className="text-[10px] text-slate-300">تحقق اللجنة المجتمعية وأثر المياه الصالحة</span>
                            </div>
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/90 to-slate-900/20 flex flex-col justify-end p-3">
                              <span className="text-white text-xs font-bold">🏫 ترميم فصول وتجهيز مدرسة ملحان</span>
                              <span className="text-[10px] text-slate-300">مطابقة ومقارنة صور الواقع الحاضر بالدراسة المسبقة</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs">
                  لا توجد تقارير رقابة أو مطابقة بالصور مسجلة حتى اللحظة. استخدم النموذج المجاور لإعداد التقرير الميداني الأول ومطابقته.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. Committee and Voluntary Knights Tab */}
      {activeTab === 'committee' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fadeIn">
          {/* Add Member Form */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-950 text-sm">تسجيل وتنشيط عضو لجنة / فارس مجتمعي</h3>
            </div>
            <p className="text-xs text-slate-500">
              يقوم الفرسان التنمويون بإشعال التفاعل المجتمعي، وتوثيق استلام واستهلاك المواد ميدانياً، والمتابعة بالنتائج.
            </p>
            <form onSubmit={handleAddCommitteeMember} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">الاسم الثلاثي للعضو</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: يحيى علي مقبل"
                  value={memName}
                  onChange={(e) => setMemName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">الدور التنموي والمسؤولية</label>
                <select
                  value={memRole}
                  onChange={(e) => setMemRole(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                >
                  <option value="knight">🐎 فارس تنموي ميداني (مسؤول التوثيق والمتابعة)</option>
                  <option value="leader">👔 رئيس اللجنة المجتمعية للمبادرة</option>
                  <option value="auditor">🔎 مدقق مالي ومطابق فني لمخرجات المواد</option>
                  <option value="member">🤝 عضو مساهم وداعم ميداني</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">رقم الهاتف للتواصل</label>
                <input
                  type="text"
                  placeholder="مثال: 777123456"
                  value={memPhone}
                  onChange={(e) => setMemPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                تنشيط العضو وإسناد المهام
              </button>
            </form>
          </div>

          {/* Committee members list */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="font-bold text-slate-950 text-sm">أعضاء الهيئة القيادية وفرسان المبادرة المجتمعية</h3>
              <p className="text-[11px] text-slate-400">
                تنظيم وتنشيط اللجان في الجمعيات يضمن ديمومة الأعمال التعاونية والتدخلات التنموية اللاحقة.
              </p>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {initiative.committee.map((c) => {
                return (
                  <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                        c.role === 'knight' ? 'bg-indigo-100 text-indigo-700' :
                        c.role === 'leader' ? 'bg-emerald-100 text-emerald-700' :
                        c.role === 'auditor' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {c.name.slice(0, 1)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-xs">{c.name}</span>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                            c.role === 'knight' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                            c.role === 'leader' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            c.role === 'auditor' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-50 text-slate-500'
                          }`}>
                            {c.role === 'knight' ? 'فارس ميداني' :
                             c.role === 'leader' ? 'رئيس اللجنة' :
                             c.role === 'auditor' ? 'مدقق فني ومالي' : 'عضو مبادر'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">📱 هاتف: {c.phone}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">{c.tasksAssigned} مهام موكلة</span>
                      <button
                        onClick={() => handleRemoveCommitteeMember(c.id)}
                        className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                        title="إلغاء تنشيط العضو"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Floating/Fixed Return to Initiatives Button */}
      <div className="pt-6 border-t border-slate-200 flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-sm rounded-2xl shadow-md transition-all cursor-pointer hover:scale-102 active:scale-98 border border-amber-300"
        >
          <ChevronLeft className="w-5 h-5 transform rotate-180 text-slate-950" />
          <span>↩️ الرجوع لقائمة المبادرات والمسارات الميدانية</span>
        </button>

        <span className="text-xs text-slate-500 font-bold hidden sm:inline-block">
          المنصة المتكاملة لإدارة الخطة التنفيذية - محافظة إب
        </span>
      </div>

      {/* Interactive Executive Decision Modal */}
      <ExecutiveDecisionModal
        isOpen={activeDecisionModal}
        onClose={() => setActiveDecisionModal(false)}
        initiative={initiative}
        initialActionType={activeActionType}
        onExecuteDecision={(updatedInit) => {
          onUpdate(updatedInit);
          setActiveDecisionModal(false);
        }}
      />
    </div>
  );
}
