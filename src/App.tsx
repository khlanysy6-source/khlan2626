/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Initiative, UserRole, ROLE_LABELS, Knight } from './types';
import { hasTabAccess, hasActionPermission, getAllowedTabsForRole, TabId, ROLE_TAB_ACCESS } from './permissions';
import { EntityPermissionsManager } from './components/EntityPermissionsManager';
import AccessDeniedCard from './components/AccessDeniedCard';
import { INITIAL_INITIATIVES, canonicalizeInitiativeRecord } from './data';
import DashboardStats from './components/DashboardStats';
import InitiativesList from './components/InitiativesList';
import InitiativeDetail from './components/InitiativeDetail';
import { generateOfflinePresentationHTML } from './utils/exportOfflinePresentation';
import ApkExportGuideModal from './components/ApkExportGuideModal';
import MasterExportModal from './components/MasterExportModal';
import { FullPlatformPrintView } from './components/FullPlatformPrintView';
import { areInitiativeNamesMatching } from './utils/nameNormalizer';
import ExecutiveCommandCenter from './components/ExecutiveCommandCenter';
import OperationsRoom from './components/OperationsRoom';
import AdaptiveNavigation from './components/AdaptiveNavigation';
import SecondPathNavigator from './components/SecondPathNavigator';
import SecondPathWorkspace from './components/SecondPathWorkspace';
import ExecutiveExperienceRouter from './features/executive/experience/ExecutiveExperienceRouter';
import InitiativeContextBanner from './components/InitiativeContextBanner';
import { safeLocalStorage, getFromIndexedDB, loadPersistedInitiatives } from './utils/safeStorage';
import { useAuth } from './security/AuthContext';
import { runRBACVerificationTests } from './security/__tests__/rbacVerifier';
import { isBootstrapAdminEmail } from './security/adminBootstrap';

import GoogleSheetsImporter from './components/GoogleSheetsImporter';

// Portal components with static imports for 100% reliable, zero-latency rendering
import WorkshopPresentation from './components/WorkshopPresentation';
import DeskReviewMatching from './components/DeskReviewMatching';
import InitiativesSheetAndKnights from './components/InitiativesSheetAndKnights';
import InteractiveGPSMap from './components/InteractiveGPSMap';
import InteractiveCharts from './components/InteractiveCharts';
import DistrictInteractivePortal from './components/DistrictInteractivePortal';
import AdvisorChat from './components/AdvisorChat';
import SmartAdvisorCenterV4 from './components/SmartAdvisorCenterV4';
import ActivationPlanGateway from './components/ActivationPlanGateway';
import PeriodicReportsPortal from './components/PeriodicReportsPortal';
import EngineersReportPortal from './components/EngineersReportPortal';
import DevelopmentResultsMatrix from './components/DevelopmentResultsMatrix';
import DevelopmentDecisionCenter from './components/DevelopmentDecisionCenter';
import FieldWorkspaceStagingPortal from './components/FieldWorkspaceStagingPortal';
import OfficialsManagementPortal from './components/OfficialsManagementPortal';
import FormsPortal from './components/FormsPortal';
import LoginPage from './components/LoginPage';
import ReleaseChangelogModal from './components/ReleaseChangelogModal';
import UnifiedControlHubModal, { SettingsTabId } from './components/UnifiedControlHubModal';
import { GlobalSearch } from './components/GlobalSearch';
import {
  Brain,
  Building,
  RotateCcw,
  ShieldCheck,
  Award,
  HelpCircle,
  MonitorPlay,
  WifiOff,
  BookOpen,
  Eye,
  EyeOff,
  Copy,
  Check,
  Info,
  AlertCircle,
  Compass,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Home,
  X,
  FileSpreadsheet,
  Coins,
  CheckCircle,
  TrendingUp,
  Calendar,
  MapPin,
  Users,
  Target,
  Activity,
  FileText,
  Pencil,
  RefreshCw,
  Download,
  Smartphone,
  Printer,
  Mail,
  Cloud,
  Database,
  Laptop,
  QrCode,
  Settings,
  Upload,
  ChevronDown,
  SlidersHorizontal,
  MoreHorizontal
} from 'lucide-react';

const DEFAULT_KNIGHTS: Knight[] = [
  {
    id: "knight_1",
    name: "م. عيسى ناجي القادري",
    district: "مديرية ذي السفال",
    subDistrict: "عزلة ريدة ورياد",
    village: "قرية الخريف",
    phone: "777123456",
    specialty: "إشراف هندسي ومتابعة",
    status: "active",
    createdAt: new Date().toISOString()
  },
  {
    id: "knight_2",
    name: "الشيخ فهد أحمد عبدالله",
    district: "مديرية السياني",
    subDistrict: "عزلة الهادلة",
    village: "قرية النجد",
    phone: "771234567",
    specialty: "تحشيد مجتمعي وعيني",
    status: "active",
    createdAt: new Date().toISOString()
  },
  {
    id: "knight_3",
    name: "المهندس عادل صالح مقبل",
    district: "مديرية جبلة",
    subDistrict: "عزلة وراف",
    village: "قرية السايلة",
    phone: "773456789",
    specialty: "إشراف هندسي ومتابعة",
    status: "active",
    createdAt: new Date().toISOString()
  },
  {
    id: "knight_4",
    name: "الأستاذ محمد حميد الحميري",
    district: "مديرية حبيش",
    subDistrict: "عزلة صرع",
    village: "قرية المنجر",
    phone: "775678901",
    specialty: "تحشيد مجتمعي وعيني",
    status: "active",
    createdAt: new Date().toISOString()
  }
];

import { getCanonicalDistrictName } from './utils/numberAndDistrictUtils';
import { getCanonicalInitiatives, sanitizeLocalCaches } from './utils/CanonicalInitiativesRepository';

// Robust lexical wrapper to prevent SecurityError and QuotaExceededError when window.localStorage is blocked or full
const localStorage = safeLocalStorage;

const normalizeDistrict = (district: string | undefined): string => {
  return getCanonicalDistrictName(district);
};

const enrichInitiativeLifecycle = (init: any) => {
  const status = init.status || 'ongoing';
  const completionRate = Number(init.completionRate) || 0;
  
  // 1. Lifecycle Stage
  let lifecycleStage = init.lifecycleStage;
  if (!lifecycleStage) {
    if (status === 'completed') lifecycleStage = 'impact_followup';
    else if (status === 'stagnant') lifecycleStage = 'decision_determination';
    else if (status === 'stopped') lifecycleStage = 'status_classification';
    else if (status === 'pending') lifecycleStage = 'field_evaluation';
    else if (completionRate > 75) lifecycleStage = 'action_execution';
    else if (completionRate > 25) lifecycleStage = 'current_monitoring';
    else lifecycleStage = 'approved';
  }

  // 2. Decision Category
  let decisionCategory = init.decisionCategory;
  if (!decisionCategory) {
    if (status === 'completed') decisionCategory = 'completed_needs_closing';
    else if (status === 'stagnant') decisionCategory = 'stagnant_needs_decision';
    else if (status === 'stopped') decisionCategory = 'needs_treatment';
    else if (status === 'pending' || completionRate < 15) decisionCategory = 'ready_for_completion';
    else decisionCategory = 'ongoing_needs_monitoring';
  }

  // 3. Evaluation
  let evaluation = init.evaluation;
  if (!evaluation) {
    let readinessLevel: 'high' | 'medium' | 'low' | 'not_ready' = 'high';
    let delayReasons: string[] = [];
    let obstacles: string[] = [];
    let requiredNeeds: string[] = [];

    if (status === 'completed') {
      readinessLevel = 'high';
      requiredNeeds = ['توفير وثائق التسليم النهائي', 'توثيق أثر المبادرة التنموي'];
    } else if (status === 'stagnant') {
      readinessLevel = 'low';
      delayReasons = [init.stagnationReason || 'سبب التوقف غير موثق بالبيانات الحالية'];
      obstacles = [init.stagnationReason ? `عائق موثق: ${init.stagnationReason}` : 'سبب التوقف غير موثق بالبيانات الحالية'];
      requiredNeeds = ['مراجعة التقرير الميداني وصرف الدفعة المتبقية من الرصيد المعتمد عند الاستحقاق'];
    } else if (status === 'stopped') {
      readinessLevel = 'not_ready';
      delayReasons = [init.stagnationReason || 'توقف الأعمال الميدانية وبانتظار تقرير الفرز الميداني'];
      obstacles = [init.stagnationReason ? `عائق موثق: ${init.stagnationReason}` : 'سبب التوقف غير موثق بالبيانات الحالية'];
      requiredNeeds = ['نزول فريق الفرز الميداني للوقوف على أسباب التوقف الموثقة'];
    } else if (status === 'pending') {
      readinessLevel = 'medium';
      requiredNeeds = ['النزول الفني الميداني للمناقلة', 'تأمين مستودع تخزين الأسمنت', 'عقد اللقاء التأسيسي'];
    } else {
      readinessLevel = 'high';
      requiredNeeds = ['متابعة الرصف الحجري اليومي', 'توفير أحجار الرصف وتنسيق نوبات العمالة الأهلية'];
    }

    evaluation = {
      readinessLevel,
      stagnationCategory: status === 'stagnant' ? 'material_shortage' : status === 'stopped' ? 'dispute' : undefined,
      delayReasons,
      obstacles,
      requiredNeeds,
      lastEvaluationDate: new Date().toISOString().split('T')[0]
    };
  }

  // 4. Executive Decision
  let executiveDecision = init.executiveDecision;
  if (!executiveDecision) {
    let requiredAction = '';
    let interventionPriority: 'urgent' | 'medium' | 'routine' = 'routine';
    let responsibleEntity = 'الجمعية التعاونية والمشرف الفني';

    if (status === 'stagnant') {
      requiredAction = 'عقد اجتماع عاجل مع وحدة التدخلات والسلطة المحلية بمديرية ' + (init.district || 'إب') + ' لاتخاذ قرار تعزيز الدعم أو المناقلة';
      interventionPriority = 'urgent';
      responsibleEntity = 'وحدة التدخلات المركزية والسلطة المحلية بالمديرية';
    } else if (status === 'stopped') {
      requiredAction = 'عقد اجتماع بين الجمعية التعاونية والسلطة المحلية بمديرية ' + (init.district || 'إب') + ' واللجنة المجتمعية لتأكيد جاهزية الأهالي للتنفيذ واستئناف الأعمال خلال 14 يوماً (وثائق التنازلات مكتملة وموثقة مسبقاً)';
      interventionPriority = 'urgent';
      responsibleEntity = 'الجمعية التعاونية وفرسان التنمية';
    } else if (status === 'completed') {
      requiredAction = 'إغلاق المبادرة وتوثيق الأثر التنموي النهائي وتسليم الطريق رسمياً للجنة المجتمعية والسلطة المحلية';
      interventionPriority = 'routine';
      responsibleEntity = 'السلطة المحلية واللجنة المجتمعية';
    } else if (status === 'pending') {
      requiredAction = 'إجراء الفرز والمطابقة الميدانية والأولية واعتماد صرف الدفعة الأولى من مواد وحدة التدخلات';
      interventionPriority = 'medium';
      responsibleEntity = 'وحدة التدخلات والمهندس المشرف';
    } else {
      requiredAction = 'استمرار المتابعة الميدانية اليومية للرصف وضمان معالجة الخرسانة بالماء ورفع التقارير الأسبوعية';
      interventionPriority = 'routine';
      responsibleEntity = 'المشرف الهندسي واللجنة الميدانية';
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + (status === 'stagnant' ? 3 : 7));

    executiveDecision = {
      requiredAction,
      interventionPriority,
      responsibleEntity,
      nextFollowUpDate: nextDate.toISOString().split('T')[0],
      decisionMaker: 'مدير عام وحدة التدخلات المركزية / السلطة المحلية',
      decisionDate: new Date().toISOString().split('T')[0],
      executionStatus: status === 'completed' ? 'executed' : 'in_execution'
    };
  }

  // 5. Monitoring Timeline
  let monitoringTimeline = init.monitoringTimeline;
  if (!monitoringTimeline || monitoringTimeline.length === 0) {
    const today = new Date().toISOString().split('T')[0];
    monitoringTimeline = [
      {
        id: `m_log_${String(Date.now())}`,
        date: today,
        projectStatus: status === 'completed' ? 'منجز بالكامل' : status === 'stagnant' ? 'متعثر تنموياً' : status === 'stopped' ? 'متوقف مؤقتاً' : 'قيد التنفيذ النشط',
        actionTaken: executiveDecision.requiredAction,
        responsiblePerson: executiveDecision.responsibleEntity,
        progressRate: completionRate,
        notes: init.stagnationReason || 'نزول ميداني وتدقيق في سجلات الصب والكميات الإسمنتية والمناقلات.'
      },
      {
        id: `m_log_${String(Date.now())}`,
        date: '2025-01-15',
        projectStatus: 'المتابعة الأولى',
        actionTaken: 'مطابقة حصر الكميات وتوثيق التنازلات القبلية وتهيئة المستودع المحلي',
        responsiblePerson: 'فارس التنمية واللجنة المجتمعية',
        progressRate: Math.max(0, completionRate - 20),
        notes: 'تم فحص جاهزية الطريق وتأمين المستودع واستلام مواد التدخلات الأولية.'
      }
    ];
  }

  return {
    lifecycleStage,
    decisionCategory,
    evaluation,
    executiveDecision,
    monitoringTimeline
  };
};

const normalizeInitiative = (init: any): Initiative => {
  const canonical = canonicalizeInitiativeRecord(init);
  const enriched = enrichInitiativeLifecycle(canonical);
  return {
    ...canonical,
    district: normalizeDistrict(canonical.district),
    lifecycleStage: enriched.lifecycleStage,
    decisionCategory: enriched.decisionCategory,
    evaluation: enriched.evaluation,
    executiveDecision: enriched.executiveDecision,
    monitoringTimeline: enriched.monitoringTimeline,
    pathways: (init.pathways || []).map((p: any) => ({
      ...p,
      title: p.id === 3 || p.title?.includes('المسار الثالث') ? 'المسار الثالث: المعالجات والمناقلات' : (p.title || ''),
      tasks: (p.tasks || []).map((t: any) => ({
        ...t,
        id: t.id || `t_${0}`,
        title: t.title || '',
        description: t.description || '',
        completed: !!t.completed,
        completedAt: t.completedAt,
        notes: t.notes
      }))
    })),
    contributions: (init.contributions || []).map((c: any) => ({
      ...c,
      id: c.id || `c_${0}`,
      donorName: c.donorName || '',
      type: c.type || 'cash',
      description: c.description || '',
      value: Number(c.value) || 0,
      date: c.date || ''
    })),
    materials: (init.materials || []).map((m: any) => ({
      ...m,
      id: m.id || `m_${0}`,
      name: m.name || '',
      quantity: Number(m.quantity) || 0,
      unit: m.unit || '',
      status: m.status || 'safe',
      storageLocation: m.storageLocation || '',
      updatedAt: m.updatedAt || '',
      notes: m.notes
    })),
    committee: (init.committee || []).map((c: any) => ({
      ...c,
      id: c.id || `c_${0}`,
      name: c.name || '',
      role: c.role || 'member',
      phone: c.phone || '',
      tasksAssigned: Number(c.tasksAssigned) || 0
    })),
    reports: (init.reports || []).map((r: any) => ({
      ...r,
      id: r.id || `r_${0}`,
      title: r.title || '',
      date: r.date || '',
      description: r.description || '',
      isMatchedWithDeskReview: !!r.isMatchedWithDeskReview,
      status: r.status || 'draft',
      achievements: Array.isArray(r.achievements) ? r.achievements : [],
      challenges: Array.isArray(r.challenges) ? r.challenges : [],
      imagePlaceholder: r.imagePlaceholder
    })),
    createdAt: init.createdAt || new Date().toISOString()
  };
};

const normalizeInitiatives = (list: any[]): Initiative[] => {
  return (list || []).map(normalizeInitiative);
};

export default function App() {
  const [initiatives, setInitiatives] = useState<Initiative[]>(() => {
    try {
      sanitizeLocalCaches();
      const saved = localStorage.getItem('cooperative_initiatives_data');
      const isCleared = localStorage.getItem('cooperative_initiatives_cleared_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && (parsed.length >= 725 || isCleared === 'true')) {
          return normalizeInitiatives(parsed);
        }
      }
      if (isCleared === 'true') {
        return [];
      }
      return normalizeInitiatives(INITIAL_INITIATIVES);
    } catch (e) {
      return normalizeInitiatives(INITIAL_INITIATIVES);
    }
  });

  const handleClearAllInitiatives = () => {
    if (window.confirm('🚨 هل أنت متأكد من مسح وإفراغ جميع المبادرات الحالية من النظام؟ ستصبح القائمة فارغة جاهزة لاستيراد الشيت الجديد.')) {
      saveInitiatives([], { isReplaceAll: true });
      localStorage.setItem('cooperative_initiatives_cleared_v2', 'true');
    }
  };
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<string | null>(null);
  const [currentPathwayId, setCurrentPathwayId] = useState<number | undefined>(undefined);
  const [previousTab, setPreviousTab] = useState<TabId | null>('home');
  const [navHistory, setNavHistory] = useState<Array<{ tab: TabId; initiativeId: string | null; pathwayId?: number }>>([]);

  // Consume Central Auth & RBAC Security Layer
  const authContext = useAuth();
  const currentUser = authContext.currentUser;
  const userRole = authContext.effectiveRole;
  const setUserRole = (role: UserRole) => {
    authContext.setDemoRole(role);
  };

  // Run RBAC V2 Security Verification Tests on initial mount
  useEffect(() => {
    const testResults = runRBACVerificationTests();
    if (testResults.allPassed) {
      console.log('✅ RBAC V2 Security Engine: ALL 7 ROLE & DATA SCOPE TESTS PASSED SUCCESSFULLY', testResults.results);
    } else {
      console.warn('⚠️ RBAC V2 Security Engine: TEST FAILURES ENCOUNTERED', testResults.results);
    }
  }, []);

  // Automatically elevate role and trigger instant cloud sync for provisioned admin emails
  useEffect(() => {
    if (currentUser && isBootstrapAdminEmail(currentUser.email)) {
      console.log('Detected official admin (Bootstrap Provisioning) - elevating role to admin and syncing instantly');
      localStorage.setItem('cooperative_admin_unlocked', 'true');
      authContext.setDemoRole('admin');

      // Trigger instant cloud sync to download latest data from Firestore
      import('./utils/firebaseSync').then(async ({ syncInitiativesWithCloud, syncTextOverridesWithCloud }) => {
        setIsSyncing(true);
        try {
          const currentLocal = JSON.parse(localStorage.getItem('cooperative_initiatives_data') || '[]');
          const syncedData = await syncInitiativesWithCloud(currentLocal.length ? currentLocal : initiatives);
          const normalizedSyncedData = normalizeInitiatives(syncedData);
          setInitiatives(normalizedSyncedData);
          localStorage.setItem('cooperative_initiatives_data', JSON.stringify(normalizedSyncedData));
          
          // Also sync overrides
          const savedOverrides = JSON.parse(localStorage.getItem('cooperative_text_overrides') || '{}');
          const syncedOverrides = await syncTextOverridesWithCloud(savedOverrides);
          setTextOverrides(syncedOverrides);
          localStorage.setItem('cooperative_text_overrides', JSON.stringify(syncedOverrides));
          
          const now = new Date();
          setSyncTime(now.toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }));
        } catch (e) {
          console.error('Initial auto-sync error:', e);
        } finally {
          setIsSyncing(false);
        }
      });
    }
  }, [currentUser]);

  const [showPresentation, setShowPresentation] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);


  const [platformTitle, setPlatformTitle] = useState(() => {
    return localStorage.getItem('platform_title') || 'منصة إدارة الخطة التنفيذية المتكاملة';
  });
  const [platformSubtitle, setPlatformSubtitle] = useState(() => {
    return localStorage.getItem('platform_subtitle') || 'وحدة التدخلات المركزية التنموية الطارئة - محافظة إب (تتبع وإدارة مبادرات الطرق المجتمعية)';
  });
  const [isEditingTitles, setIsEditingTitles] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [tempSubtitle, setTempSubtitle] = useState('');

  // Unified Text Overrides System for full header and UI text customization (Admin only)
  const [textOverrides, setTextOverrides] = useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cooperative_text_overrides');
      try {
        return saved ? JSON.parse(saved) : {};
      } catch (e) {
        console.warn('Failed to parse text overrides from storage:', e);
        return {};
      }
    }
    return {};
  });

  const t = (key: string, defaultValue: string): string => {
    return textOverrides[key] || defaultValue;
  };

  const handleSaveAllTextOverrides = async (newOverrides: Record<string, string>) => {
    setTextOverrides(newOverrides);
    localStorage.setItem('cooperative_text_overrides', JSON.stringify(newOverrides));
    try {
      const { saveTextOverridesToCloud } = await import('./utils/firebaseSync');
      await saveTextOverridesToCloud(newOverrides);
    } catch (err) {
      console.warn('Failed to save text overrides to cloud:', err);
    }
  };

  const [isEditingCustomTexts, setIsEditingCustomTexts] = useState(false);
  const [tempOverrides, setTempOverrides] = useState<Record<string, string>>({});
  const [overrideSearch, setOverrideSearch] = useState('');
  const [newOverrideKey, setNewOverrideKey] = useState('');
  const [newOverrideValue, setNewOverrideValue] = useState('');
  const [activeTranslationTab, setActiveTranslationTab] = useState('all');

  useEffect(() => {
    if (isEditingCustomTexts) {
      setTempOverrides({ ...textOverrides });
    }
  }, [isEditingCustomTexts]);

  // Passcode Lock States
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [inputPasscode, setInputPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isMasterExportOpen, setIsMasterExportOpen] = useState(false);
  const [isFullPlatformPrintActive, setIsFullPlatformPrintActive] = useState(false);
  const [activeGuideStep, setActiveGuideStep] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isControlHubOpen, setIsControlHubOpen] = useState(false);
  const [controlHubTab, setControlHubTab] = useState<SettingsTabId>('general');
  const [activeMainTab, setActiveMainTab] = useState<TabId>('home');

  // Dynamic Role Permissions State (synced with Firebase Firestore)
  const [rolePermissionsConfig, setRolePermissionsConfig] = useState<Record<string, TabId[]>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cooperative_role_tab_permissions');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) return parsed;
        } catch (e) {}
      }
    }
    return ROLE_TAB_ACCESS;
  });

  const [activeAdminSettingsTab, setActiveAdminSettingsTab] = useState<'entity_permissions' | 'backup_texts'>('entity_permissions');

  // Helper function to check tab access using live dynamic role permissions config
  const checkHasAccess = (tabId: TabId) => {
    return hasTabAccess(userRole, tabId, rolePermissionsConfig);
  };

  const handleSaveRolePermissions = async (updatedConfig: Record<string, TabId[]>) => {
    setRolePermissionsConfig(updatedConfig);
    localStorage.setItem('cooperative_role_tab_permissions', JSON.stringify(updatedConfig));
    try {
      const { saveRolePermissionsToCloud } = await import('./utils/firebaseSync');
      await saveRolePermissionsToCloud(updatedConfig);
    } catch (err) {
      console.warn('Failed to save role permissions to cloud:', err);
    }
  };

  // Subscribe to real-time role permissions updates in Firebase
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    import('./utils/firebaseSync').then(async ({ syncRolePermissionsWithCloud, subscribeToRolePermissions }) => {
      const cloudPerms = await syncRolePermissionsWithCloud(rolePermissionsConfig);
      if (cloudPerms && Object.keys(cloudPerms).length > 0) {
        setRolePermissionsConfig(cloudPerms as Record<string, TabId[]>);
        localStorage.setItem('cooperative_role_tab_permissions', JSON.stringify(cloudPerms));
      }

      unsubscribe = subscribeToRolePermissions((updated) => {
        if (updated && Object.keys(updated).length > 0) {
          setRolePermissionsConfig(updated as Record<string, TabId[]>);
          localStorage.setItem('cooperative_role_tab_permissions', JSON.stringify(updated));
        }
      });
    }).catch(err => {
      console.warn('Failed to initialize role permissions cloud sync:', err);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Auto-switch tab if selected role does not have permission for current activeMainTab
  useEffect(() => {
    if (!hasTabAccess(userRole, activeMainTab, rolePermissionsConfig)) {
      const allowed = getAllowedTabsForRole(userRole, rolePermissionsConfig);
      if (allowed.length > 0) {
        setActiveMainTab(allowed[0]);
      }
    }
  }, [userRole, activeMainTab, rolePermissionsConfig]);
  const [simulationStats, setSimulationStats] = useState<{ budget: number; time: number; quality: number }>({ budget: 100, time: 100, quality: 100 });
  const [knights, setKnights] = useState<Knight[]>(() => {
    try {
      const savedKnights = localStorage.getItem('cooperative_knights_data');
      if (savedKnights) {
        const parsed = JSON.parse(savedKnights);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_KNIGHTS;
  });
  const [preSelectedDistrict, setPreSelectedDistrict] = useState<string | null>(null);
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<string>('all');
  const [openDropdown, setOpenDropdown] = useState<'initiatives' | 'monitoring' | 'decision' | 'results' | 'more' | null>(null);

  const handleTabSelect = (tab: TabId) => {
    if (activeMainTab !== tab || selectedInitiativeId !== null) {
      setNavHistory(prev => {
        const last = prev[prev.length - 1];
        if (last && last.tab === activeMainTab && last.initiativeId === selectedInitiativeId) return prev;
        return [...prev, { tab: activeMainTab, initiativeId: selectedInitiativeId }];
      });
    }
    setActiveMainTab(tab);
    setSelectedInitiativeId(null);
    setOpenDropdown(null);
  };

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncTime, setSyncTime] = useState<string | null>(null);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const currentLocal = JSON.parse(localStorage.getItem('cooperative_initiatives_data') || '[]');
      const { syncInitiativesWithCloud } = await import('./utils/firebaseSync');
      const syncedData = await syncInitiativesWithCloud(currentLocal.length ? currentLocal : initiatives);
      const normalizedSyncedData = normalizeInitiatives(syncedData);
      setInitiatives(normalizedSyncedData);
      localStorage.setItem('cooperative_initiatives_data', JSON.stringify(normalizedSyncedData));
      
      const now = new Date();
      setSyncTime(now.toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.warn('Failed to manually sync with cloud:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Load from local storage and sync with cloud
  useEffect(() => {
    let isMounted = true;

    async function hydrateAndSync() {
      const isCleared = localStorage.getItem('cooperative_initiatives_cleared_v2') === 'true';
      
      // 1. Retrieve the largest persisted dataset across memory, localStorage, and IndexedDB
      const persisted = await loadPersistedInitiatives();
      let initialLocalData: Initiative[] = [];

      if (persisted && persisted.length > 0) {
        initialLocalData = normalizeInitiatives(persisted);
      } else if (isCleared) {
        initialLocalData = [];
      } else {
        initialLocalData = normalizeInitiatives(INITIAL_INITIATIVES);
      }

      if (!isMounted) return;

      setInitiatives(initialLocalData);
      safeLocalStorage.setItem('cooperative_initiatives_data', JSON.stringify(initialLocalData));

      // Load Knights from local storage
      let initialKnightsLocal: Knight[] = [];
      const savedKnights = localStorage.getItem('cooperative_knights_data');
      if (savedKnights) {
        try {
          initialKnightsLocal = JSON.parse(savedKnights);
          if (initialKnightsLocal.length === 0) {
            initialKnightsLocal = DEFAULT_KNIGHTS;
          }
        } catch (e) {
          initialKnightsLocal = DEFAULT_KNIGHTS;
        }
      } else {
        initialKnightsLocal = DEFAULT_KNIGHTS;
      }
      setKnights(initialKnightsLocal);
      safeLocalStorage.setItem('cooperative_knights_data', JSON.stringify(initialKnightsLocal));

      // Dynamic background sync with Firestore
      setIsSyncing(true);
      try {
        const { syncInitiativesWithCloud, syncTextOverridesWithCloud, syncKnightsWithCloud } = await import('./utils/firebaseSync');
        
        // 1. Sync initiatives safely with local protection
        const syncedData = await syncInitiativesWithCloud(initialLocalData);
        if (isMounted && syncedData && Array.isArray(syncedData) && syncedData.length > 0) {
          const normalizedSyncedData = normalizeInitiatives(syncedData);
          setInitiatives(normalizedSyncedData);
          safeLocalStorage.setItem('cooperative_initiatives_data', JSON.stringify(normalizedSyncedData));
        }

        // 2. Sync text overrides
        const savedOverrides = JSON.parse(localStorage.getItem('cooperative_text_overrides') || '{}');
        const syncedOverrides = await syncTextOverridesWithCloud(savedOverrides);
        if (isMounted) {
          setTextOverrides(syncedOverrides);
          safeLocalStorage.setItem('cooperative_text_overrides', JSON.stringify(syncedOverrides));
        }

        // 3. Sync Knights directory
        const syncedKnights = await syncKnightsWithCloud(initialKnightsLocal);
        if (isMounted) {
          setKnights(syncedKnights);
          safeLocalStorage.setItem('cooperative_knights_data', JSON.stringify(syncedKnights));
        }

        const now = new Date();
        if (isMounted) {
          setSyncTime(now.toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }));
        }
      } catch (err) {
        console.warn('Failed to run cloud synchronization background task:', err);
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    }

    hydrateAndSync();

    // Check URL parameters for role setting
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role') || params.get('mode');
    if (roleParam === 'visitor' || roleParam === 'guest') {
      setUserRole('visitor');
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Periodic background sync every 15 seconds to keep phone and computer in perfect parity
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { syncInitiativesWithCloud, syncTextOverridesWithCloud } = await import('./utils/firebaseSync');
        const currentLocal = (await loadPersistedInitiatives()) || [];
        if (currentLocal.length > 0) {
          setIsSyncing(true);
          const syncedData = await syncInitiativesWithCloud(currentLocal);
          if (syncedData && Array.isArray(syncedData) && syncedData.length > 0) {
            const normalizedSyncedData = normalizeInitiatives(syncedData);
            setInitiatives(normalizedSyncedData);
            safeLocalStorage.setItem('cooperative_initiatives_data', JSON.stringify(normalizedSyncedData));
          }
          
          // Also periodically sync text overrides
          const savedOverrides = JSON.parse(localStorage.getItem('cooperative_text_overrides') || '{}');
          const syncedOverrides = await syncTextOverridesWithCloud(savedOverrides);
          setTextOverrides(syncedOverrides);
          safeLocalStorage.setItem('cooperative_text_overrides', JSON.stringify(syncedOverrides));

          const now = new Date();
          setSyncTime(now.toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }));
        }
      } catch (err) {
        console.warn('Periodic sync failed:', err);
      } finally {
        setIsSyncing(false);
      }
    }, 15000); // 15s interval for real-time parity

    return () => clearInterval(interval);
  }, []);

  // Trigger sync immediately upon tab reopening or page refocus (highly critical for mobile/computer sync)
  useEffect(() => {
    const handleSyncOnRefocus = async () => {
      if (document.visibilityState === 'visible') {
        console.log('App re-opened or tab focused, triggering immediate cloud sync...');
        try {
          const { syncInitiativesWithCloud, syncTextOverridesWithCloud } = await import('./utils/firebaseSync');
          setIsSyncing(true);
          const currentLocal = (await loadPersistedInitiatives()) || [];
          if (currentLocal.length > 0) {
            const syncedData = await syncInitiativesWithCloud(currentLocal);
            if (syncedData && Array.isArray(syncedData) && syncedData.length > 0) {
              const normalizedSyncedData = normalizeInitiatives(syncedData);
              setInitiatives(normalizedSyncedData);
              safeLocalStorage.setItem('cooperative_initiatives_data', JSON.stringify(normalizedSyncedData));
            }
          }
          const savedOverrides = JSON.parse(localStorage.getItem('cooperative_text_overrides') || '{}');
          const syncedOverrides = await syncTextOverridesWithCloud(savedOverrides);
          setTextOverrides(syncedOverrides);
          safeLocalStorage.setItem('cooperative_text_overrides', JSON.stringify(syncedOverrides));

          const now = new Date();
          setSyncTime(now.toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' }));
        } catch (err) {
          console.warn('Refocus sync failed:', err);
        } finally {
          setIsSyncing(false);
        }
      }
    };

    document.addEventListener('visibilitychange', handleSyncOnRefocus);
    window.addEventListener('focus', handleSyncOnRefocus);
    return () => {
      document.removeEventListener('visibilitychange', handleSyncOnRefocus);
      window.removeEventListener('focus', handleSyncOnRefocus);
    };
  }, []);

  // Save to local storage on change
  const saveInitiatives = (newData: Initiative[], options?: { isReplaceAll?: boolean }) => {
    const normalized = normalizeInitiatives(newData);
    setInitiatives(normalized);
    safeLocalStorage.setItem('cooperative_initiatives_data', JSON.stringify(normalized));
    localStorage.setItem('cooperative_has_imported_dataset', 'true');
    localStorage.setItem('cooperative_initiatives_count', String(normalized.length));
    localStorage.removeItem('cooperative_initiatives_cleared_v2');

    // Async batch save to cloud Firestore
    import('./utils/firebaseSync').then(({ uploadAllToCloud, replaceCloudCollection }) => {
      if (options?.isReplaceAll) {
        replaceCloudCollection(normalized);
      } else if (currentUser) {
        uploadAllToCloud(normalized);
      }
    }).catch(err => {
      console.warn('Failed to upload initiatives to cloud:', err);
    });
  };

  // Save knights to local storage and sync with cloud
  const saveKnights = (newData: Knight[]) => {
    setKnights(newData);
    localStorage.setItem('cooperative_knights_data', JSON.stringify(newData));

    if (currentUser) {
      import('./utils/firebaseSync').then(({ saveKnightsToCloud }) => {
        saveKnightsToCloud(newData);
      }).catch(err => {
        console.warn('Failed to upload knights to cloud:', err);
      });
    }
  };

  const handleAddKnight = (knight: Knight) => {
    const updated = [...knights, knight];
    saveKnights(updated);
  };

  const handleUpdateKnight = (updatedKnight: Knight) => {
    const updated = knights.map(k => k.id === updatedKnight.id ? updatedKnight : k);
    saveKnights(updated);
  };

  const handleDeleteKnight = (id: string) => {
    const updated = knights.filter(k => k.id !== id);
    saveKnights(updated);
  };

  // Reset to seed data
  const handleResetData = () => {
    if (userRole === 'visitor') return;
    if (confirm('هل أنت متأكد من إعادة تعيين البيانات إلى الحالة الافتراضية؟ سيتم مسح أي مبادرات أو مساهمات قمت بإضافتها.')) {
      saveInitiatives(INITIAL_INITIATIVES, { isReplaceAll: true });
      setSelectedInitiativeId(null);
    }
  };

  // Add initiative
  const handleAddInitiative = (newInit: Initiative) => {
    if (userRole === 'visitor') return;
    const withTimestamp: Initiative = {
      ...newInit,
      createdAt: newInit.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [withTimestamp, ...initiatives];
    saveInitiatives(updated);
  };

  // Update initiative (when tasks, contributions, materials, or reports change)
  const handleUpdateInitiative = (updated: Initiative) => {
    if (userRole === 'visitor') return;
    const withTimestamp: Initiative = {
      ...updated,
      updatedAt: new Date().toISOString()
    };
    const updatedList = initiatives.map(init => init.id === withTimestamp.id ? withTimestamp : init);
    saveInitiatives(updatedList);
  };

  // Delete initiative
  const handleDeleteInitiative = (id: string) => {
    if (userRole === 'visitor') return;
    const updated = initiatives.filter(init => init.id !== id);
    saveInitiatives(updated);
    if (selectedInitiativeId === id) {
      setSelectedInitiativeId(null);
    }
    if (currentUser) {
      import('./utils/firebaseSync').then(({ deleteInitiativeFromCloud }) => {
        deleteInitiativeFromCloud(id);
      }).catch(err => {
        console.warn('Failed to delete initiative from cloud:', err);
      });
    }
  };

  // Copy shareable visitor-mode link
  const handleCopyVisitorLink = () => {
    const visitorUrl = `${window.location.origin}${window.location.pathname}?role=visitor`;
    navigator.clipboard.writeText(visitorUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Export full interactive presentation offline package
  const handleExportOfflineHTML = () => {
    const total = initiatives.length;
    const completed = initiatives.filter(i => i.status === 'completed').length;
    const pending = initiatives.filter(i => i.status === 'pending').length;
    const stagnant = initiatives.filter(i => i.status === 'stagnant').length;
    const ongoing = initiatives.filter(i => i.status === 'ongoing').length;
    const stopped = initiatives.filter(i => i.status === 'stopped').length;

    const completedPct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const ongoingPct = total > 0 ? Math.round((ongoing / total) * 100) : 0;
    const pendingPct = total > 0 ? Math.round((pending / total) * 100) : 0;
    const stagnantPct = total > 0 ? Math.round((stagnant / total) * 100) : 0;
    const stoppedPct = total > 0 ? Math.round((stopped / total) * 100) : 0;

    const totalContributionsValue = initiatives.reduce((sum, init) => {
      return sum + (init.contributions?.reduce((s, c) => s + (c.value || 0), 0) || 0);
    }, 0);

    const cashValue = initiatives.reduce((sum, init) => {
      return sum + (init.contributions?.filter(c => c.type === 'cash').reduce((s, c) => s + (c.value || 0), 0) || 0);
    }, 0);

    const materialValue = initiatives.reduce((sum, init) => {
      return sum + (init.contributions?.filter(c => c.type === 'inkind_material').reduce((s, c) => s + (c.value || 0), 0) || 0);
    }, 0);

    const laborValue = initiatives.reduce((sum, init) => {
      return sum + (init.contributions?.filter(c => c.type === 'inkind_labor').reduce((s, c) => s + (c.value || 0), 0) || 0);
    }, 0);

    const stats = {
      total,
      completed,
      ongoing,
      pending,
      stagnant,
      stopped,
      completedPct,
      ongoingPct,
      pendingPct,
      stagnantPct,
      stoppedPct,
      totalContributionsValue,
      cashValue,
      materialValue,
      laborValue
    };

    const htmlContent = generateOfflinePresentationHTML(initiatives, stats);

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'workshop_presentation_ibb_dhi_as_sufal_offline.html');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download all initiatives as a JSON backup file for field engineers
  const handleDownloadBackupJSON = () => {
    try {
      const backupData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        governorate: 'محافظة إب - الجمهورية اليمنية',
        unit: 'وحدة التدخلات المركزية التنموية الطارئة',
        description: 'نسخة احتياطية شاملة لجميع بيانات وشيتات المبادرات الميدانية والمسارات والمساهمات',
        totalCount: initiatives.length,
        initiatives: initiatives
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.setAttribute('download', `نسخة_احتياطية_المبادرات_الميدانية_إب_${dateStr}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('فشل تنزيل النسخة الاحتياطية:', err);
      alert('حدث خطأ أثناء تنزيل النسخة الاحتياطية. يرجى التكرم بالمحاولة مجدداً.');
    }
  };

  // Restore initiatives from a JSON backup file
  const handleRestoreBackupJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const rawInits = Array.isArray(parsed) ? parsed : (parsed.initiatives || []);
        
        if (!Array.isArray(rawInits) || rawInits.length === 0) {
          alert('الملف المحدد لا يحتوي على بيانات مبادرات صالحة.');
          return;
        }

        if (window.confirm(`هل أنت ألكيد من استعادة النسخة الاحتياطية وتحديث المبادرات الميدانية؟ (سيتم استعادة ${rawInits.length} مبادرة)`)) {
          const normalized = normalizeInitiatives(rawInits);
          setInitiatives(normalized);
          localStorage.setItem('cooperative_initiatives_data', JSON.stringify(normalized));
          alert(`تمت استعادة ${normalized.length} مبادرة بنجاح!`);
        }
      } catch (err) {
        console.error('فشل استعادة النسخة الاحتياطية:', err);
        alert('فشل قراءة ملف النسخة الاحتياطية JSON. تأكد من أن الملف سليم بصيغة JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const selectedInitiative = useMemo(() => {
    return initiatives.find(init => init.id === selectedInitiativeId) || null;
  }, [initiatives, selectedInitiativeId]);

  // Dynamic metrics calculations for the landing page
  const totalInitiatives = useMemo(() => initiatives.length, [initiatives.length]);
  
  const { totalContributions, totalTasks, completedTasks, overallProgressPercentage } = useMemo(() => {
    let contribs = 0;
    let tasks = 0;
    let completed = 0;
    for (let i = 0; i < initiatives.length; i++) {
      const init = initiatives[i];
      if (init.contributions) {
        for (let j = 0; j < init.contributions.length; j++) {
          contribs += init.contributions[j].value || 0;
        }
      }
      if (init.pathways) {
        for (let j = 0; j < init.pathways.length; j++) {
          const pTasks = init.pathways[j].tasks;
          if (pTasks) {
            tasks += pTasks.length;
            for (let k = 0; k < pTasks.length; k++) {
              if (pTasks[k].completed) completed++;
            }
          }
        }
      }
    }
    const pct = tasks > 0 ? Math.round((completed / tasks) * 100) : 0;
    return {
      totalContributions: contribs,
      totalTasks: tasks,
      completedTasks: completed,
      overallProgressPercentage: pct
    };
  }, [initiatives]);

  const totalBeneficiaries = useMemo(() => initiatives.length * 2800, [initiatives.length]);

  // Sort initiatives to get the 3 latest ones
  const latestInitiatives = useMemo(() => {
    return [...initiatives]
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, 3);
  }, [initiatives]);

  const districtSummaries = useMemo(() => {
    const defaultDistricts = [
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
    
    const districts = Array.from(new Set([
      ...defaultDistricts,
      ...initiatives.map(init => init.district).filter(Boolean)
    ]));

    return districts.map((districtName, idx) => {
      const filtered = initiatives.filter(init => init.district === districtName);
      const totalCount = filtered.length;
      let totalCost = 0;
      let totalComm = 0;
      let totalUnit = 0;
      let completionSum = 0;
      for (let i = 0; i < filtered.length; i++) {
        const item = filtered[i];
        totalCost += item.cost || 0;
        totalComm += item.communityContribution || 0;
        totalUnit += item.unitContribution || 0;
        completionSum += item.completionRate || 0;
      }
      const avgCompletion = totalCount > 0 ? Math.round(completionSum / totalCount) : 0;
      return {
        districtName,
        totalCount,
        totalCost,
        totalComm,
        totalUnit,
        avgCompletion,
        idx
      };
    });
  }, [initiatives]);

  const TAB_NAME_MAP: Record<string, string> = {
    forms_portal: 'بوابة النماذج والمعاملات',
    home: 'الصفحة الرئيسية 🏠',
    initiatives: 'المبادرات والمسارات الميدانية 🛣️',
    district_portal: 'بوابات المديريات والخرائط 🏛️',
    decision_center: 'مركز اتخاذ القرار التنموي 🧠',
    matching_results: 'نتائج الفرز والمطابقة 📑',
    matrix: 'مصفوفة الكميات ومقارنة الأسمنت ⚖️',
    periodic_reports: 'التقارير التنفيذية الدوريّة 📋',
    engineers_portal: 'استمارة وتقارير المهندسين 👷‍♂️',
    field_staging: 'نظام الرفع الميداني والمراجعة 📍',
    interactive_charts: 'المخططات والرسوم البيانية 📈',
    interactive_map: 'الخريطة الميدانية GPS 🗺️',
    sheets_import: 'استيراد وتحديث Google Sheets 📑',
    tracking_sheet: 'شيت المتابعة ودليل الفرسان 📊',
    workshop: 'الورشة التدريبية والمحاكاة 💻',
    advisor: 'المستشار التنموي والهندسي 🤖',
    activation_plan: 'مرجع خطة التفعيل 📘',
    about: 'عن المنصة وبطاقة التعريف ℹ️',
  };

  const handleContextualNavigateTab = (tab: TabId | string, initiativeId?: string | null, pathwayId?: number) => {
    const newTab = tab as TabId;
    const targetInitId = initiativeId !== undefined ? initiativeId : selectedInitiativeId;
    const targetPathwayId = pathwayId !== undefined ? pathwayId : currentPathwayId;

    if (activeMainTab !== newTab || selectedInitiativeId !== targetInitId || currentPathwayId !== targetPathwayId) {
      setNavHistory(prev => {
        const last = prev[prev.length - 1];
        if (last && last.tab === activeMainTab && last.initiativeId === selectedInitiativeId && last.pathwayId === currentPathwayId) {
          return prev;
        }
        return [...prev, { tab: activeMainTab, initiativeId: selectedInitiativeId, pathwayId: currentPathwayId }];
      });
    }
    if (activeMainTab !== newTab) {
      setPreviousTab(activeMainTab);
    }
    if (initiativeId !== undefined) {
      setSelectedInitiativeId(initiativeId);
    }
    if (pathwayId !== undefined) {
      setCurrentPathwayId(pathwayId);
    }
    setActiveMainTab(newTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoBack = () => {
    if (navHistory.length > 0) {
      const lastState = navHistory[navHistory.length - 1];
      setNavHistory(prev => prev.slice(0, -1));
      setActiveMainTab(lastState.tab);
      setSelectedInitiativeId(lastState.initiativeId);
      setCurrentPathwayId(lastState.pathwayId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // Context-aware fallback if history stack is empty
    if (activeMainTab !== 'initiatives' && selectedInitiativeId) {
      setActiveMainTab('initiatives');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (selectedInitiativeId) {
      setSelectedInitiativeId(null);
      setCurrentPathwayId(undefined);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (activeMainTab !== 'home') {
      setActiveMainTab('home');
      setSelectedInitiativeId(null);
      setCurrentPathwayId(undefined);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectInitiativeFromHome = (id: string, pathwayId?: number) => {
    handleContextualNavigateTab('initiatives', id, pathwayId);
  };

  // Manual interactive steps data
  const guideSteps = [
    {
      title: '🧭 ١. التحول نحو الإدارة بالنتائج والمسارات الخمسة',
      desc: 'تم بناء هذه المنصة خصيصاً لمتابعة مبادرات رصف وعقبات الطرق بمحافظة إب. ننتقل هنا من مجرد رصد الصرف المالي التقليدي إلى تتبع الفرز التنموي الفعلي عبر خمسة مسارات متكاملة: التشخيص الفني الأولي، تفعيل الشركاء، الفرز والتحقق، حراسة المواصفات، والتوثيق والفرز النهائي للأثر التنموي لمطابقة المنجزات بالنتائج الحقيقية.',
      tip: 'عند فتح أي مبادرة، ستجد المسارات الخمسة واضحة ومقسمة بالتساوي لحساب معدل الإنجاز بدقة.'
    },
    {
      title: '💾 ٢. التشغيل بدون إنترنت (أوفلاين) في القرى الجبلية والاحتفاظ بالبيانات',
      desc: 'تتميز المنصة بدعمها الكامل للنزول الميداني في عقبات قرى محافظة إب الوعرة التي تنعدم فيها شبكات الجوال والإنترنت تماماً:\n\n• الدخول: بمجرد فتح المنصة لأول مرة أثناء اتصالك بالإنترنت، تظل مخزنة في متصفحك بشكل كامل وتعمل بشكل اعتيادي.\n• حفظ البيانات: يتم حفظ جميع المساهمات المجتمعية التي تضيفها وتعديلات المهام وقراءات مخازن الإسمنت والتقارير الفنية محلياً وفوراً في ذاكرة المتصفح الآمنة (LocalStorage) دون الحاجة لشبكة إطلاقاً.\n• المزامنة الذكية: عند العودة لمناطق التغطية، تتزامن بياناتك تلقائياً وبأمان مع قواعد البيانات السحابية (Firestore) وتبقى محفوظة في المنصة وعلى السحابة في آن واحد.\n• التصفح في تطبيق خارجي مستقل خارج كروم: يمكنك تشغيل وتصفح المنصة كبرنامج مستقل بالكامل على هاتفك أو كمبيوترك دون إنترنت ودون الدخول لمتصفح كروم؛ كل ما عليك فعله هو فتح المنصة في متصفح جوجل كروم (Chrome)، ثم الضغط على النقاط الثلاث بالأعلى واختيار "إضافة إلى الشاشة الرئيسية" (Add to Home Screen) أو "تثبيت التطبيق" (Install App). سيظهر لك رمز المنصة على واجهة جهازك وتعمل كتطبيق مستقل مع إبقاء المعلومات محفوظة هنا وهناك ومزامنتها بالكامل!',
      tip: 'لا تقم بمسح سجل المتصفح (Browser Cache) أثناء العمل الميداني لضمان الاحتفاظ الكامل بالتعديلات المحلية غير المتزامنة.'
    },
    {
      title: '🔒 ٣. وضع الزائر للقراءة فقط والتحكم في البيانات الظاهرة',
      desc: 'عند مشاركتك لرابط المنصة مع الداعمين، المغتربين، لجان التعبئة العامة، أو السلطة المحلية، يمكنك الحفاظ على سلامة مدخلاتك عبر نظام صلاحية الزوار المبتكر:\n\n• منع التعديل التام: يتم حظر كافة أزرار الإضافة والتعديل والحذف وإعادة التعيين لعامة الزوار وحذفها من الشاشات.\n• البيانات المحددة للزائر: لحماية خصوصية بيانات الجمعية وتجنب الحرج، تظهر للزائر مؤشرات عامة فقط (مثل نسبة الإنجاز والتقارير الفنية المعتمدة) وتُخفى التفاصيل الحساسة مثل جهات وأرقام تواصل المتبرعين أو السجلات المخزنية التمهيدية غير المعتمدة.',
      tip: 'انسخ رابط الزائر المباشر بالضغط على زر نسخ رابط المشاركة لترميز رابطك التلقائي بـ ?role=visitor.'
    },
    {
      title: '🏗️ ٤. تطبيق عملي لنموذج رصف "طريق الجشاعة"',
      desc: 'ضربنا في المنصة مثالاً عملياً متكاملاً وهو "مشروع رصف طريق الجشاعة بمحافظة إب".\n\n• المسار الأول (التشخيص): تم الانتهاء من المسح وحساب الأثر السكاني وسحب وثائق التنازلات للأرض.\n• المسار الثاني (التفعيل): تم رصد مساهمات الأهالي (عينية وبشرية ونقدية) بقيمتها التقديرية الحقيقية.\n• المسار الثالث (التحقق): فحص المخازن وضمان عدم تأثر الإسمنت بالرطوبة والسيول الجبلية.\n• المسار الرابع (المتابعة): جودة تقطيع ورصف الأحجار وتوفير سواقي السيول والعبارات.\n• المسار الخامس (الفرز النهائي): تصوير الطريق وإعداد الحساب الختامي.',
      tip: 'يمكنك مراجعة هذا المشروع النموذجي الآن في القائمة الرئيسية لتفهم آلية الفرز الفعلي بالتفصيل.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#f0f2f5] font-sans selection:bg-emerald-600 selection:text-white pb-12 overflow-x-hidden max-w-full" dir="rtl">
      {/* Top Professional High Density Header */}
      <header className="sticky top-0 z-50 bg-slate-950 text-white border-b border-slate-800 shadow-lg" id="app-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10px] font-black tracking-widest text-emerald-300">وحدة التدخلات المركزية التنموية الطارئة — محافظة إب</div>
            <div className="text-base sm:text-lg font-black truncate">منصة إدارة المبادرات المجتمعية — المسار التنفيذي الثاني</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black"><ShieldCheck size={13} className="text-emerald-300"/> مصدر الحقيقة محمي</span>
            <button onClick={() => { setControlHubTab('general'); setIsControlHubOpen(true); }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-[10px] font-black"><Settings size={14}/> التحكم</button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 overflow-x-hidden">
        <SecondPathNavigator
          userRole={userRole}
          activeTab={activeMainTab}
          roleConfig={rolePermissionsConfig}
          selectedInitiative={selectedInitiative?.name || null}
          onNavigate={(tab) => handleContextualNavigateTab(tab)}
        />
        <SecondPathWorkspace
          initiatives={initiatives}
          selectedInitiative={selectedInitiative}
          activeTab={activeMainTab}
          onNavigate={(tab) => handleContextualNavigateTab(tab, selectedInitiativeId)}
        />
        <div className="hidden" aria-hidden="true">
        <AdaptiveNavigation
          userRole={userRole}
          activeTab={activeMainTab}
          initiativesCount={initiatives.length}
          roleConfig={rolePermissionsConfig}
          onNavigate={(tab) => handleContextualNavigateTab(tab)}
          onOpenSettings={() => { setControlHubTab('general'); setIsControlHubOpen(true); }}
          onOpenGuide={() => setShowGuideModal(true)}
          onOpenSearch={() => document.querySelector<HTMLInputElement>('[placeholder*="ابحث عن"]')?.focus()}
        />
        </div>
        {/* --- Universal Sticky Back & Breadcrumb Bar for Every View/List --- */}
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3 shadow-md mb-4 sticky top-2 z-40 space-y-2.5 animate-fadeIn" id="universal-back-navigation-bar">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Back and Home Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleGoBack}
                disabled={activeMainTab === 'home' && !selectedInitiativeId && navHistory.length === 0}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs ${
                  (activeMainTab !== 'home' || selectedInitiativeId || navHistory.length > 0)
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 border border-amber-300 hover:scale-102 active:scale-98 shadow-sm'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                }`}
                title="الرجوع إلى القائمة أو الشاشة السابقة"
                id="btn-global-go-back"
              >
                <ArrowRight className="w-4 h-4 text-slate-950" />
                <span>↩️ رجوع للخلف</span>
              </button>

              <button
                onClick={() => {
                  setNavHistory([]);
                  setSelectedInitiativeId(null);
                  setActiveMainTab('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                  activeMainTab === 'home' && !selectedInitiativeId
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
                title="العودة مباشرة للقائمة الرئيسية"
                id="btn-global-go-home"
              >
                <Home className="w-3.5 h-3.5" />
                <span>الرئيسية 🏠</span>
              </button>

              {navHistory.length > 0 && (
                <span className="text-[10px] bg-amber-50 text-amber-900 border border-amber-200/80 px-2.5 py-1 rounded-lg font-bold hidden sm:inline-block">
                  سجل التنقل: {navHistory.length} خطوة
                </span>
              )}
            </div>

            {/* Breadcrumb path */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 overflow-x-auto max-w-full py-0.5 dir-rtl">
              <span className="text-slate-400 font-medium">الموقع الحالي:</span>
              <button 
                onClick={() => handleTabSelect('home')}
                className="hover:text-emerald-700 hover:underline cursor-pointer"
              >
                الرئيسية
              </button>
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0 transform rotate-180" />
              <span className="text-emerald-800 font-black bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 shrink-0">
                {TAB_NAME_MAP[activeMainTab] || activeMainTab}
              </span>
              {selectedInitiative && (
                <>
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0 transform rotate-180" />
                  <span className="text-indigo-900 font-black bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200/60 truncate max-w-[180px]">
                    {selectedInitiative.name}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Unified Fast Portals Switcher Strip */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
            <span className="text-[11px] font-black text-slate-400 shrink-0 ml-1">الانتقال المباشر:</span>
            
            {/* 1. مركز التحكم التنفيذي */}
            {hasTabAccess(userRole, 'home') && (
              <button
                onClick={() => handleTabSelect('home')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer border ${
                  activeMainTab === 'home' && !selectedInitiativeId
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs font-black'
                    : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border-slate-200 hover:border-emerald-200'
                }`}
                title="مركز التحكم التنفيذي الشامل"
              >
                <Compass className="w-3 h-3 text-emerald-600" />
                <span>التحكم التنفيذي</span>
              </button>
            )}

            {/* 2. سجل المبادرات */}
            {hasTabAccess(userRole, 'initiatives') && (
              <button
                onClick={() => handleTabSelect('initiatives')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer border ${
                  activeMainTab === 'initiatives'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs font-black'
                    : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border-slate-200 hover:border-emerald-200'
                }`}
                title="سجل ومحفظة المبادرات"
              >
                <Activity className="w-3 h-3 text-emerald-600" />
                <span>سجل المبادرات ({initiatives.length})</span>
              </button>
            )}

            {/* 3. النماذج والمعاملات */}
            {hasTabAccess(userRole, 'forms_portal') && (
              <button
                onClick={() => handleTabSelect('forms_portal')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer border ${
                  activeMainTab === 'forms_portal' ? 'bg-indigo-700 text-white border-indigo-700 shadow-2xs font-black' : 'bg-slate-50 hover:bg-indigo-50 text-slate-700 border-slate-200 hover:border-indigo-200'
                }`}
                title="النماذج الأصلية والمعاملات المرتبطة بالمبادرة"
              >
                <FileSpreadsheet className="w-3 h-3 text-indigo-600" />
                <span>النماذج والمعاملات</span>
              </button>
            )}

            {/* 3. التقييم الميداني */}
            {(hasTabAccess(userRole, 'field_staging') || hasTabAccess(userRole, 'engineers_portal')) && (
              <button
                onClick={() => handleTabSelect(hasTabAccess(userRole, 'field_staging') ? 'field_staging' : 'engineers_portal')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer border ${
                  ['field_staging', 'engineers_portal', 'matching_results', 'tracking_sheet'].includes(activeMainTab)
                    ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs font-black'
                    : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border-slate-200 hover:border-emerald-200'
                }`}
                title="التقييم والرفع الميداني"
              >
                <ShieldCheck className="w-3 h-3 text-amber-600" />
                <span>التقييم الميداني</span>
              </button>
            )}

            {/* 4. التحليل التنموي والمستشار */}
            {hasTabAccess(userRole, 'advisor') && (
              <button
                onClick={() => handleTabSelect('advisor')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer border ${
                  activeMainTab === 'advisor'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs font-black'
                    : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border-slate-200 hover:border-emerald-200'
                }`}
                title="المستشار التنموي والهندسي"
              >
                <Brain className="w-3 h-3 text-indigo-600" />
                <span>المستشار الذكي</span>
              </button>
            )}

            {/* 5. التقارير والمطبوعات */}
            {(hasTabAccess(userRole, 'periodic_reports') || hasTabAccess(userRole, 'interactive_charts')) && (
              <button
                onClick={() => handleTabSelect(hasTabAccess(userRole, 'periodic_reports') ? 'periodic_reports' : 'interactive_charts')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer border ${
                  ['periodic_reports', 'interactive_charts', 'interactive_map'].includes(activeMainTab)
                    ? 'bg-blue-700 text-white border-blue-700 shadow-2xs font-black'
                    : 'bg-slate-50 hover:bg-blue-50 text-slate-700 border-slate-200 hover:border-blue-200'
                }`}
                title="التقارير والمخططات الدورية"
              >
                <TrendingUp className="w-3 h-3 text-blue-600" />
                <span>التقارير والمؤشرات</span>
              </button>
            )}

            {/* 6. القرارات والمتابعة */}
            {(hasTabAccess(userRole, 'decision_center') || hasTabAccess(userRole, 'matrix')) && (
              <button
                onClick={() => handleTabSelect(hasTabAccess(userRole, 'decision_center') ? 'decision_center' : 'matrix')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer border ${
                  ['decision_center', 'matrix'].includes(activeMainTab)
                    ? 'bg-gradient-to-r from-emerald-800 to-indigo-900 text-white border-emerald-700 shadow-2xs font-black'
                    : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border-slate-200 hover:border-emerald-200'
                }`}
                title="مركز تحليل القرار وتتبع المصفوفة"
              >
                <Award className="w-3 h-3 text-amber-500" />
                <span>القرارات والمتابعة</span>
              </button>
            )}
          </div>
        </div>
        {!checkHasAccess(activeMainTab) ? (
          <AccessDeniedCard currentRole={userRole} tabId={activeMainTab as TabId} onGoHome={() => setActiveMainTab('home')} />
        ) : (
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-24 bg-white/80 backdrop-blur-xs border border-slate-200 rounded-3xl space-y-4 shadow-xs my-6">
              <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-center space-y-1">
                <p className="text-sm font-black text-slate-800">جاري تحميل البوابة بسرعات عالية...</p>
                <p className="text-xs text-slate-500 font-medium">نظام Lazy Loading التكيفي لتأجيل تحميل البوابات الكبيرة وتوفير سعة الذاكرة</p>
              </div>
            </div>
          }>
            {/* Contextual Initiative Navigation Header (Sticky Context Banner) */}
            {selectedInitiative && (
              <InitiativeContextBanner
                initiative={selectedInitiative}
                activeMainTab={activeMainTab}
                previousTab={previousTab}
                onNavigateTab={handleContextualNavigateTab}
                onClearInitiative={() => {
                  setSelectedInitiativeId(null);
                  setCurrentPathwayId(undefined);
                }}
                onBack={handleGoBack}
                currentPathway={currentPathwayId}
                userRole={userRole}
              />
            )}

            {/* --- TAB 0: LOGIN PORTAL (12 INSTITUTIONAL ACCOUNTS) --- */}
            {activeMainTab === 'login' && (
              <LoginPage onNavigateHome={() => setActiveMainTab('home')} />
            )}

            {/* --- TAB: بوابة النماذج والمعاملات المرتبطة بدورة حياة المبادرة --- */}
            {activeMainTab === 'forms_portal' && (
              <FormsPortal
                initiatives={initiatives}
                selectedInitiativeId={selectedInitiativeId}
                onSelectInitiative={(id) => setSelectedInitiativeId(id)}
                onNavigateTab={(tab) => handleContextualNavigateTab(tab, selectedInitiativeId)}
                userRole={userRole}
              />
            )}

            {/* --- TAB 5: استيراد وتحديث Google Sheets --- */}
        {activeMainTab === 'sheets_import' && (
          <GoogleSheetsImporter
            initiatives={initiatives}
            onImport={(importedData, mode) => {
              if (mode === 'replace') {
                saveInitiatives(importedData, { isReplaceAll: true });
              } else {
                const merged = [...initiatives];
                importedData.forEach((importedItem) => {
                  const existingIdx = merged.findIndex((item) => {
                    // Primary matching: match by Initiative Name
                    if (areInitiativeNamesMatching(item.name, importedItem.name)) {
                      return true;
                    }
                    // Secondary matching: match by Initiative Number if valid and not REF/placeholder
                    if (
                      item.initiativeNumber && 
                      importedItem.initiativeNumber && 
                      item.initiativeNumber === importedItem.initiativeNumber &&
                      !item.initiativeNumber.includes('REF') &&
                      !item.initiativeNumber.includes('IM-')
                    ) {
                      return true;
                    }
                    return false;
                  });
                  if (existingIdx !== -1) {
                    // Smart merge
                    merged[existingIdx] = {
                      ...merged[existingIdx],
                      ...importedItem,
                      cost: importedItem.cost || merged[existingIdx].cost,
                      communityContribution: importedItem.communityContribution || merged[existingIdx].communityContribution,
                      unitContribution: importedItem.unitContribution || merged[existingIdx].unitContribution,
                      completionRate: importedItem.completionRate !== undefined ? importedItem.completionRate : merged[existingIdx].completionRate,
                      status: importedItem.status || merged[existingIdx].status,
                      pathways: importedItem.pathways || merged[existingIdx].pathways,
                      contributions: (importedItem.contributions && importedItem.contributions.length > 0) ? importedItem.contributions : (merged[existingIdx].contributions || []),
                      materials: (importedItem.materials && importedItem.materials.length > 0) ? importedItem.materials : (merged[existingIdx].materials || []),
                    };
                  } else {
                    merged.push(importedItem);
                  }
                });
                saveInitiatives(merged);
              }
              setActiveMainTab('initiatives');
            }}
            onCancel={() => setActiveMainTab('home')}
            onClearAll={handleClearAllInitiatives}
          />
        )}

        {/* --- TAB 4: الورشة التدريبية --- */}
        {activeMainTab === 'workshop' && (
          <WorkshopPresentation
            initiatives={initiatives}
            onClose={() => setActiveMainTab('home')}
            onUpdateInitiative={handleUpdateInitiative}
            role={userRole}
            onStatsChange={(stats) => setSimulationStats(stats)}
          />
        )}

        {/* --- TAB: المستشار التنموي والهندسي V4 --- */}
        {activeMainTab === 'advisor' && (
          <SmartAdvisorCenterV4
            initiatives={initiatives}
            onUpdateInitiative={handleUpdateInitiative}
            onNavigateTab={(tab) => handleContextualNavigateTab(tab, selectedInitiativeId)}
            onSelectInitiative={(init) => handleContextualNavigateTab('initiatives', init.id)}
            userRole={userRole}
            targetInitiativeId={selectedInitiativeId}
          />
        )}

        {/* --- TAB: مركز تحليل النتائج والقرار التنموي الذكي --- */}
        {activeMainTab === 'decision_center' && (
          <DevelopmentDecisionCenter
            initiatives={initiatives}
            targetInitiativeId={selectedInitiativeId}
            onSelectInitiative={(init) => handleContextualNavigateTab('initiatives', init.id)}
          />
        )}

        {/* --- TAB: نتائج الفرز والمطابقة الفنية --- */}
        {activeMainTab === 'matching_results' && (
          <DeskReviewMatching
            initiatives={initiatives}
            targetInitiativeId={selectedInitiativeId}
            onUpdateInitiative={handleUpdateInitiative}
            userRole={userRole}
          />
        )}

        {/* --- TAB: مصفوفة الكميات ومقارنة الأسمنت المستقلة --- */}
        {activeMainTab === 'matrix' && (
          <DevelopmentResultsMatrix
            initiatives={initiatives}
            targetInitiativeId={selectedInitiativeId}
            onSelectInitiative={(init) => handleContextualNavigateTab('initiatives', init.id)}
          />
        )}

        {/* --- TAB: شيت المتابعة ودليل الفرسان --- */}
        {activeMainTab === 'tracking_sheet' && (
          <InitiativesSheetAndKnights
            initiatives={initiatives}
            onUpdateInitiative={handleUpdateInitiative}
            knights={knights}
            onAddKnight={handleAddKnight}
            onUpdateKnight={handleUpdateKnight}
            onDeleteKnight={handleDeleteKnight}
            userRole={userRole}
          />
        )}

        {/* --- TAB: نظام العمل الميداني والرفع المباشر ومراجعة المشرف --- */}
        {activeMainTab === 'field_staging' && (
          <FieldWorkspaceStagingPortal
            initiatives={initiatives}
            onUpdateInitiative={handleUpdateInitiative}
            onAddInitiative={handleAddInitiative}
            userRole={userRole}
          />
        )}

        {/* --- TAB: مرجع خطة التفعيل --- */}
        {activeMainTab === 'activation_plan' && (
          <ActivationPlanGateway
            onNavigateToInitiatives={() => handleContextualNavigateTab('initiatives', selectedInitiativeId)}
          />
        )}

        {/* --- TAB: التقارير الأسبوعية والشهرية --- */}
        {activeMainTab === 'periodic_reports' && (
          <PeriodicReportsPortal
            initiatives={initiatives}
            targetInitiativeId={selectedInitiativeId}
          />
        )}

        {/* --- TAB: استمارة وتقارير المهندسين --- */}
        {activeMainTab === 'engineers_portal' && (
          <EngineersReportPortal
            initiatives={initiatives}
            targetInitiativeId={selectedInitiativeId}
            onUpdateInitiative={handleUpdateInitiative}
            userRole={userRole}
          />
        )}

        {/* --- TAB: سجل إدارة المسؤولين والصلاحيات وشيت الهواتف --- */}
        {activeMainTab === 'officials_management' && (
          <OfficialsManagementPortal
            onBack={() => handleGoBack()}
            onNavigateToInitiative={(initId) => handleContextualNavigateTab('initiatives', initId)}
          />
        )}

        {/* --- TAB 6: بوابات المديريات والخرائط التفاعلية --- */}

        {activeMainTab === 'district_portal' && (
          <DistrictInteractivePortal
            initiatives={initiatives}
            preSelectedDistrict={preSelectedDistrict}
            onSelectInitiative={(id) => handleContextualNavigateTab('initiatives', id)}
            onClose={() => handleGoBack()}
            userRole={userRole}
            onUpdateInitiative={handleUpdateInitiative}
          />
        )}

        {/* --- TAB 1: الصفحة الرئيسية --- */}
        {activeMainTab === 'home' && (
          <div className="space-y-8 animate-fadeIn" id="home-tab-content">
            {/* V10 Central Operations Room Layer */}
            <OperationsRoom
              initiatives={initiatives}
              userRole={userRole}
              onNavigateTab={(tab) => {
                setActiveMainTab(tab as any);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSelectInitiative={(id) => handleSelectInitiativeFromHome(id)}
            />

            {/* Banner of Platform */}
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-md" id="app-intro-banner">
              <div className="absolute right-0 top-0 w-1/2 h-full opacity-5 pointer-events-none">
                <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
                  <path d="M0,0 Q50,100 100,0 Z" />
                </svg>
              </div>

              <div className="relative z-10 space-y-4 max-w-4xl">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold px-3.5 py-1.5 rounded-full">
                    <Award className="w-4 h-4" />
                    وحدة التدخلات المركزية التنموية الطارئة بمحافظة إب - إدارة المبادرات بالنتائج
                  </div>
                  <div className="inline-flex items-center gap-1.5 bg-blue-500/25 border border-blue-400/30 text-blue-300 text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-blue-400 inline-block animate-pulse"></span>
                    سجلات Google Sheets مفعلة ومطابقة بالكامل 📊
                  </div>
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black leading-snug">
                  {t('bannerTitle', 'تفعيل مبادرات الطرق المجتمعية لمديريات محافظة إب وإدارتها بالنتائج')}
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium text-justify">
                  {t('bannerDesc', 'تلتزم وحدة التدخلات المركزية التنموية الطارئة بمحافظة إب بمتابعة وتفعيل ٧٣٣ مبادرة أهلية مخصصة لرصف، شق، وتأهيل عقبات وطرقات كافة مديريات محافظة إب عبر بوابات المديريات المتكاملة. تتقسم المهام الميدانية والإشرافية على خمسة مسارات تنموية دقيقة بدءاً من التحقق والتوثيق واللجان المجتمعية، وجمع المساهمات العينية والنقدية، وحماية ومناقلة المواد، وصولاً للتحشيد الإعلامي والرقابة والفرز المكتبي لمطابقة الإنجاز بالنتائج. المطور والمعد للمنصة م. عيسى ناجي القادري مسؤول المتابعة والإشراف بمحافظة إب.')}
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setActiveMainTab('sheets_import')}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer border border-emerald-400/40 hover:scale-[1.02]"
                    id="btn-activate-imported-sheet-home"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                    <span>تنشيط وتحديث الشيت المستورد من جوجل 📊</span>
                  </button>
                  <button
                    onClick={() => setActiveMainTab('decision_center')}
                    className="inline-flex items-center gap-2 bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-black px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer border border-emerald-400/20"
                  >
                    <Brain className="w-4 h-4 text-emerald-400" />
                    <span>مركز اتخاذ القرار التنموي 🧠</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Platform Overview & Vision & Mission Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Box 1: Platform Overview */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-3xs flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-xl font-bold text-xs border border-emerald-100/50">
                    <Info className="w-4 h-4" />
                    {t('platformIntroBadge', 'نبذة عامة وتأسيسية عن المنصة')}
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900">
                    {t('platformIntroTitle', 'المنظومة الرقمية لإدارة الخطة التنفيذية بمحافظة إب')}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium text-justify">
                    {t('platformIntroDesc', 'منصة تفاعلية رائدة متخصصة في إدارة ومتابعة وتدقيق المبادرات الأهلية لمبادرات الطرق والتمكين بمختلف عزل وقرى مديريات محافظة إب. صممت المنصة بالارتكاز على منهجية الإدارة بالنتائج، لتتجاوز التقارير الورقية التقليدية إلى تتبع حقيقي ودقيق لمراحل تفعيل المبادرات وسحب تنازلات الأراضي وإثبات الملكية المجتمعية ومتابعة مخازن الأسمنت والمواد في المناطق الوعرة التي تفتقر للإنترنت.')}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setActiveMainTab('about')}
                    className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 hover:text-emerald-850 transition-colors cursor-pointer"
                  >
                    <span>{t('readMoreLink', 'اقرأ المزيد عن أهداف المنصة وكيفية عملها ←')}</span>
                  </button>
                </div>
              </div>

              {/* Box 2: Vision & Mission */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-3xs space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-800 font-extrabold text-sm border-b border-slate-100 pb-2">
                    <Target className="w-5 h-5 text-amber-500" />
                    <span>{t('visionTitle', 'رؤية مبادرات الطرق بالمحافظة:')}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                    {t('visionDesc', 'الريادة في تحويل المبادرات المجتمعية لعقبات وطرق محافظة إب إلى نموذج تنموي مستدام يرتكز على الإدارة بالنتائج والمشاركة الفاعلة، لضمان وصول آمن للخدمات وفك الحصار الجغرافي عن جميع العزل والقرى الجبلية الوعرة بمحافظة إب.')}
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 text-slate-800 font-extrabold text-sm border-b border-slate-100 pb-2">
                    <Activity className="w-5 h-5 text-indigo-500" />
                    <span>{t('missionTitle', 'رسالة المبادرات وأهدافها التنموية:')}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                    {t('missionDesc', 'تفعيل طاقات المجتمع المحلي وإشراك المغتربين والشركاء التنمويين عبر التنسيق مع وحدة التدخلات المركزية بمحافظة إب، وتطبيق مسارات الإدارة الخمسة لضمان تنفيذ المبادرات بأعلى معايير الجودة والكفاءة، والتوثيق والفرز المستمر للأثر التنموي لمطابقة المنجز الميداني.')}
                  </p>
                </div>
              </div>
            </div>

            {/* Cloud Sync & Offline Viewing Section */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-3xs space-y-6" id="cloud-sync-assistant-section">
              <div className="border-r-4 border-emerald-600 pr-3">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 font-sans">
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                  مساعد البث والمزامنة السحابية للهاتف والعرض أوفلاين 📱☁️
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  حلول متكاملة تضمن مزامنة بياناتك على هاتفك وتصفح العرض التدريبي في القرى والجبال بدون إنترنت تماماً
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                {/* Right side: Cloud Sync and Phone Scan */}
                <div className="border border-slate-100 rounded-2xl p-5 bg-gradient-to-br from-white to-slate-50/50 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xs">
                      <Cloud className="w-4 h-4 text-emerald-600 animate-pulse" />
                      <span>١. المزامنة الذكية مع هاتفك الذكي (عبر البريد الإلكتروني):</span>
                    </div>
                    
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      لتعديل السجلات وحفظها من الكمبيوتر وفتحها من هاتفك في أي وقت لاحق، يرجى اتباع الخطوات البسيطة التالية:
                    </p>

                    <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700">
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">1</span>
                        <p>
                          اضغط على زر <strong className="text-emerald-700">"ربط السحابة بحساب Google"</strong> في أعلى الشاشة وسجل ببريدك الإلكتروني: <span className="font-mono underline text-slate-900">eesaalqadri25@gmail.com</span>
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">2</span>
                        <p>
                          امسح كود <strong className="text-emerald-700">QR</strong> المقابل بكاميرا هاتفك لفتح المنصة مباشرة على الهاتف.
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">3</span>
                        <p>
                          اضغط على نفس الزر في الهاتف لتسجيل الدخول بـ <strong className="text-emerald-700">نفس الحساب</strong>.
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">4</span>
                        <p>
                          ستلاحظ مزامنة كافة المبادرات والتعديلات والمسارات فورياً في كلا الجهازين بنقرة واحدة!
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-500">حالة الاتصال السحابي الحالية:</span>
                      {currentUser ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          متصل بالبريد: {currentUser.email}
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-800 border border-amber-100 text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          غير متصل بالسحابة (محلي فقط)
                        </span>
                      )}
                    </div>
                  </div>

                  {!currentUser && (
                    <button
                      onClick={async () => {
                        try {
                          const { googleSignIn } = await import('./utils/firebaseAuth');
                          await googleSignIn();
                        } catch (err) {
                          console.warn('Google Sign-In failed:', err);
                        }
                      }}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs"
                    >
                      <Mail className="w-4 h-4" />
                      <span>ربط وتفعيل السحابة الآن بالبريد الإلكتروني 📧</span>
                    </button>
                  )}
                </div>

                {/* Left side: QR Code and Offline Download */}
                <div className="border border-slate-100 rounded-2xl p-5 bg-gradient-to-br from-white to-slate-50/50 flex flex-col md:flex-row gap-5 items-center justify-between">
                  {/* QR Code display */}
                  <div className="flex flex-col items-center text-center space-y-2 bg-white p-3 rounded-2xl border border-slate-100 shadow-3xs shrink-0 w-full md:w-auto">
                    <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(window.location.origin + window.location.pathname)}`}
                        alt="QR Code to open app on phone"
                        className="w-[120px] h-[120px]"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">امسح الكود لفتح المنصة بهاتفك 📸</span>
                    
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.origin + window.location.pathname);
                        alert('تم نسخ رابط المنصة المباشر بنجاح! يمكنك إرساله لنفسك عبر الواتساب وفتحه بالهاتف.');
                      }}
                      className="text-[9px] font-black text-emerald-700 hover:underline bg-emerald-50 px-2 py-0.5 rounded cursor-pointer"
                    >
                      نسخ الرابط المباشر 🔗
                    </button>
                  </div>

                  {/* Offline Presentation Download details */}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xs">
                      <Laptop className="w-4 h-4 text-emerald-600" />
                      <span>٢. نسخة العرض بدون إنترنت (أوفلاين 💾):</span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      إذا كنت ستقيم ورشة تدريبية في عزل وقرى جبلية وعرة <strong className="text-rose-600 font-extrabold">منقطعة تماماً عن شبكة الإنترنت</strong>، يمكنك تنزيل ملف واحد تفاعلي كامل ومستقل يحتوي على نفس التصميم والمخططات وسجل المبادرات لفتحه بالبروجكتر أو الهاتف بدون إنترنت إطلاقاً!
                    </p>

                    <button
                      onClick={handleExportOfflineHTML}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs"
                    >
                      <Download className="w-4 h-4 text-emerald-300" />
                      <span>تنزيل حقيبة العرض التفاعلي (أوفلاين 💾)</span>
                    </button>

                    <div className="text-[10px] text-slate-400 font-bold text-center">
                      * يعمل الملف على أي كمبيوتر أو هاتف ذكي بمجرد النقر المزدوج عليه دون حاجة لإنترنت.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block animate-pulse"></span>
                مؤشرات الأداء التنموي والمساهمات التراكمية بالمنصة:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Metric 1: Number of Initiatives */}
                <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200/60 rounded-2xl p-5 shadow-3xs flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-500 block">عدد المبادرات</span>
                    <h3 className="text-3xl font-mono font-black text-slate-800">{totalInitiatives} مبادرة</h3>
                    <span className="text-[10px] text-slate-400 font-bold block">موزعة على كافة مديريات وعزل محافظة إب</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <Building className="w-6 h-6" />
                  </div>
                </div>

                {/* Metric 2: Number of Beneficiaries */}
                <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200/60 rounded-2xl p-5 shadow-3xs flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-500 block">عدد المستفيدين</span>
                    <h3 className="text-3xl font-mono font-black text-slate-800">
                      {totalBeneficiaries.toLocaleString('ar-YE')} مستفيد
                    </h3>
                    <span className="text-[10px] text-slate-400 font-bold block">سكان وعزل وقرى جبلية وعرة</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                {/* Metric 3: Total Cost / Contributions */}
                <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200/60 rounded-2xl p-5 shadow-3xs flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-500 block">إجمالي التكلفة</span>
                    <h3 className="text-lg sm:text-xl font-bold text-emerald-800 leading-tight">
                      {totalContributions >= 1000000 
                        ? `${(totalContributions / 1000000).toFixed(2)} مليون ريال` 
                        : `${totalContributions.toLocaleString('ar-YE')} ريال`}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-bold block">مساهمات عينية ونقدية ذاتية</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                    <Coins className="w-6 h-6" />
                  </div>
                </div>

                {/* Metric 4: Progress Percentage */}
                <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200/60 rounded-2xl p-5 shadow-3xs flex items-center justify-between">
                  <div className="space-y-1 w-full">
                    <span className="text-xs font-bold text-slate-500 block">نسبة الإنجاز</span>
                    <h3 className="text-3xl font-mono font-black text-slate-800">{overallProgressPercentage}%</h3>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div 
                        className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${overallProgressPercentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 mr-3">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>

            {/* --- بوابات المديريات (District Gateways) --- */}
            <div className="space-y-4" id="district-gateways-section">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-r-4 border-emerald-600 pr-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <Compass className="w-5 h-5 text-emerald-600 animate-spin-slow" />
                    بوابات مديريات محافظة إب التنموية الـ ٢٠ ({initiatives.length} مبادرة مفعّلة)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    انقر على بوابة أي مديرية للدخول المباشر واستعراض مبادراتها وتتبع مسارات الإنجاز الخمسة بدقة
                  </p>
                </div>
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-lg shrink-0">
                  تحديث حي من سجلات الميدان 🏛️
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {districtSummaries.map(({ districtName, totalCount, totalCost, totalComm, totalUnit, avgCompletion, idx }) => {
                  const cardGradients = [
                    'from-emerald-50/50 to-white hover:border-emerald-300 hover:shadow-emerald-50',
                    'from-sky-50/50 to-white hover:border-sky-300 hover:shadow-sky-50',
                    'from-amber-50/50 to-white hover:border-amber-300 hover:shadow-amber-50',
                    'from-indigo-50/50 to-white hover:border-indigo-300 hover:shadow-indigo-50',
                    'from-rose-50/50 to-white hover:border-rose-300 hover:shadow-rose-50',
                    'from-violet-50/50 to-white hover:border-violet-300 hover:shadow-violet-50',
                    'from-teal-50/50 to-white hover:border-teal-300 hover:shadow-teal-50',
                    'from-fuchsia-50/50 to-white hover:border-fuchsia-300 hover:shadow-fuchsia-50',
                    'from-orange-50/50 to-white hover:border-orange-300 hover:shadow-orange-50',
                    'from-cyan-50/50 to-white hover:border-cyan-300 hover:shadow-cyan-50',
                    'from-pink-50/50 to-white hover:border-pink-300 hover:shadow-pink-50',
                    'from-lime-50/50 to-white hover:border-lime-300 hover:shadow-lime-50',
                  ];
                  const cardGrad = cardGradients[idx % cardGradients.length];

                  const textColors = [
                    'text-emerald-700 bg-emerald-50 border-emerald-100',
                    'text-sky-700 bg-sky-50 border-sky-100',
                    'text-amber-700 bg-amber-50 border-amber-100',
                    'text-indigo-700 bg-indigo-50 border-indigo-100',
                    'text-rose-700 bg-rose-50 border-rose-100',
                    'text-violet-700 bg-violet-50 border-violet-100',
                    'text-teal-700 bg-teal-50 border-teal-100',
                    'text-fuchsia-700 bg-fuchsia-50 border-fuchsia-100',
                    'text-orange-700 bg-orange-50 border-orange-100',
                    'text-cyan-700 bg-cyan-50 border-cyan-100',
                    'text-pink-700 bg-pink-50 border-pink-100',
                    'text-lime-700 bg-lime-50 border-lime-100',
                  ];
                  const textColor = textColors[idx % textColors.length];

                  return (
                    <div
                      key={districtName}
                      className={`bg-gradient-to-b ${cardGrad} border border-slate-200/80 rounded-2xl p-5 shadow-3xs hover:shadow-md transition-all flex flex-col justify-between`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg border ${textColor}`}>
                            {districtName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">بوابة {(idx + 1).toString().padStart(2, '0')}</span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                            <span>المبادرات النشطة:</span>
                            <span className="font-extrabold text-slate-800 text-sm">{totalCount} مبادرة</span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                            <span>التكلفة الكلية:</span>
                            <span className="font-extrabold text-slate-800">
                              {totalCost >= 1000000000
                                ? `${(totalCost / 1000000000).toFixed(2)} مليار`
                                : totalCost >= 1000000 
                                ? `${(totalCost / 1000000).toFixed(1)} مليون` 
                                : `${totalCost.toLocaleString('ar-YE')} ريال`}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                            <span>مساهمة المجتمع:</span>
                            <span className="font-extrabold text-emerald-800">
                              {totalComm >= 1000000 
                                ? `${(totalComm / 1000000).toFixed(1)} مليون` 
                                : `${totalComm.toLocaleString('ar-YE')} ريال`}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                            <span>مساهمة الدولة:</span>
                            <span className="font-extrabold text-indigo-800">
                              {totalUnit >= 1000000 
                                ? `${(totalUnit / 1000000).toFixed(1)} مليون` 
                                : `${totalUnit.toLocaleString('ar-YE')} ريال`}
                            </span>
                          </div>
                        </div>

                        {/* District Completion Bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold">
                            <span>معدل الإنجاز العام:</span>
                            <span className="text-slate-800">{avgCompletion}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-emerald-600 h-1.5 rounded-full" 
                              style={{ width: `${avgCompletion}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setPreSelectedDistrict(districtName);
                          setActiveMainTab('district_portal');
                          setSelectedInitiativeId(null);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="w-full mt-4 inline-flex items-center justify-center gap-1.5 py-2 bg-slate-900 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-3xs"
                      >
                        <span>دخول بوابة المديرية 🏛️</span>
                        <ChevronRight className="w-3.5 h-3.5 transform rotate-180" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Interactive GPS Map Section */}
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block animate-pulse"></span>
                  الخريطة الحية وتتبع الإحداثيات الجغرافية لمبادرات محافظة إب:
                </h3>
              </div>
              <InteractiveGPSMap 
                initiatives={initiatives} 
                onSelectInitiative={handleSelectInitiativeFromHome} 
              />
            </div>

            {/* Live Performance Charts & Key Performance Indicators (KPIs) Section */}
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block animate-pulse"></span>
                  المخططات التفاعلية ونسب المساهمة والإنجاز:
                </h3>
              </div>
              <InteractiveCharts initiatives={initiatives} />
            </div>

            {/* Latest Initiatives Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block animate-pulse"></span>
                  أحدث المبادرات التنموية النشطة:
                </h3>
                <button
                  onClick={() => setActiveMainTab('initiatives')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer bg-emerald-50 border border-emerald-100/50 px-3 py-1 rounded-lg transition-all"
                >
                  عرض سجل المبادرات الـ ٤٨ بالكامل ←
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {latestInitiatives.map((init) => {
                  const totalTasksCount = init.pathways.reduce((sum, p) => sum + p.tasks.length, 0);
                  const completedTasksCount = init.pathways.reduce((sum, p) => sum + p.tasks.filter(t => t.completed).length, 0);
                  const progressRatio = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
                  const totalContValue = init.contributions.reduce((sum, c) => sum + c.value, 0);

                  return (
                    <div
                      key={init.id}
                      className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between shadow-3xs"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            init.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : init.status === 'ongoing'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                              : init.status === 'stagnant'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : init.status === 'stopped'
                              ? 'bg-rose-50 text-rose-700 border border-rose-100'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {init.status === 'completed' ? 'منجزة ✓' : init.status === 'ongoing' ? 'مستمر وقيد التفعيل' : init.status === 'stagnant' ? 'متعثرة ⚠️' : init.status === 'stopped' ? 'متوقفة 🛑' : 'لم تبدأ ⏳'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">{init.createdAt}</span>
                        </div>

                        <h4 className="font-extrabold text-slate-900 text-sm line-clamp-2 leading-relaxed">
                          {init.name}
                        </h4>

                        <div className="flex items-center gap-1 text-slate-500 text-xs font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{init.district}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1 pt-1.5">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>التقدم في المسارات الخمسة:</span>
                            <span className="font-black text-slate-800">{progressRatio}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-emerald-600 h-1.5 rounded-full" 
                              style={{ width: `${progressRatio}%` }}
                            />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-[11px] font-bold text-slate-600">
                          <span>المساهمات:</span>
                          <span className="text-emerald-700">
                            {totalContValue >= 1000000 
                              ? `${(totalContValue / 1000000).toFixed(2)} مليون ريال` 
                              : `${totalContValue.toLocaleString('ar-YE')} ريال`}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSelectInitiativeFromHome(init.id)}
                        className="w-full mt-4 inline-flex items-center justify-center gap-1.5 py-2 bg-slate-900 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-3xs"
                      >
                        <span>تفعيل المسارات الخمسة</span>
                        <ChevronRight className="w-3.5 h-3.5 transform rotate-180" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Embedded Full Initiatives Directory & Interactive Search List on Home Tab */}
            <div className="space-y-4 pt-4 border-t border-slate-200" id="home-initiatives-full-list">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-r-4 border-emerald-600 pr-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-600 animate-pulse" />
                    دليل وقائمة المبادرات والمسارات المجتمعية بالمحافظة ({initiatives.length} مبادرة)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    البحث السريع والفلترة الحية حسب المديرية أو الحالة أو العزلة لتفعيل المسارات الخمسة مباشرة من الصفحة الرئيسية
                  </p>
                </div>
              </div>

              <InitiativesList
                initiatives={initiatives}
                onSelect={(init) => handleSelectInitiativeFromHome(init.id)}
                onAdd={handleAddInitiative}
                onDelete={handleDeleteInitiative}
                onImportAll={(data) => saveInitiatives(data, { isReplaceAll: true })}
                role={userRole}
                initialDistrictFilter={selectedDistrictFilter}
                onNavigateTab={(tab, initiativeId) => handleContextualNavigateTab(tab, initiativeId)}
                onUpdateInitiative={handleUpdateInitiative}
              />
            </div>
          </div>
        )}

        {/* --- TAB 2: المبادرات والتفعيل --- */}
        {activeMainTab === 'initiatives' && (
          <div className="space-y-6 animate-fadeIn" id="initiatives-tab-content">
            {/* Global Dashboard Metrics (Shown only when in initiatives tab list) */}
            {!selectedInitiativeId && <DashboardStats initiatives={initiatives} />}

            {/* Core application body */}
            {selectedInitiative ? (
              <div className="animate-fadeIn">
                {/* Navigation back and active workspace */}
                <div className="mb-4">
                  <button
                    onClick={handleGoBack}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg"
                  >
                    ← العودة إلى قائمة المبادرات بالمديريات
                  </button>
                </div>
                <InitiativeDetail
                  initiative={selectedInitiative}
                  onBack={handleGoBack}
                  onUpdate={handleUpdateInitiative}
                  role={userRole}
                  onNavigateTab={(tab, initiativeId, pathwayId) => handleContextualNavigateTab(tab, initiativeId, pathwayId)}
                  initialPathwayId={currentPathwayId}
                />
              </div>
            ) : (
              <div className="animate-fadeIn">
                <InitiativesList
                  initiatives={initiatives}
                  onSelect={(init) => handleContextualNavigateTab('initiatives', init.id)}
                  onAdd={handleAddInitiative}
                  onDelete={handleDeleteInitiative}
                  onImportAll={(data) => saveInitiatives(data, { isReplaceAll: true })}
                  role={userRole}
                  initialDistrictFilter={selectedDistrictFilter}
                  onNavigateTab={(tab, initiativeId, pathwayId) => handleContextualNavigateTab(tab, initiativeId, pathwayId)}
                  onUpdateInitiative={handleUpdateInitiative}
                />
              </div>
            )}
          </div>
        )}

        {/* --- TAB 3: الصفحة المستقلة (عن المنصة) --- */}
        {activeMainTab === 'about' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 md:p-10 shadow-3xs space-y-8 animate-fadeIn" id="about-tab-content">
            {/* Header Document Style */}
            <div className="border-b-2 border-emerald-700/20 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-xs font-black px-3 py-1 rounded-lg border border-emerald-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  المنظومة التقنية التنموية - نسخة الخطة المعتمدة
                </div>
                <h2 className="text-2xl font-black text-slate-950 tracking-tight">وثيقة الأهداف وبطاقة تعريف المنصة</h2>
                <p className="text-xs text-slate-400 font-bold">تأسيس وإصدار لجان الحوكمة والتحقق لوحدة التدخلات المركزية بمحافظة إب</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 bg-emerald-700 rounded-lg text-white flex items-center justify-center font-bold">
                  v2.5
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">رقم الإصدار التنموي:</span>
                  <span className="text-xs font-black text-slate-800">الإصدار المستقر v2.5.0</span>
                </div>
              </div>
            </div>

            {/* نبذة عن أهداف المنصة */}
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">
                  🎯
                </div>
                <h3 className="text-lg font-black text-slate-900">نبذة عن أهداف منصة حوكمة المبادرات:</h3>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-semibold text-justify">
                تأسست منصة المبادرات التعاونية لتفعيل الخطة التنفيذية بمحافظة إب كأداة رقمية وتقنية رائدة لخدمة العمل التنموي وإدارة حشود المتطوعين والفرسان الميدانيين في محافظة إب. تهدف المنصة إلى التخلي عن الأساليب التقليدية والانتقال الكامل نحو حوكمة وتجويد الأداء التنموي وتطبيق الإدارة بالنتائج عبر الأهداف الاستراتيجية التالية:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 space-y-2 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2 text-emerald-700 font-black text-xs sm:text-sm">
                    <Target className="w-4.5 h-4.5" />
                    <span>١. تمكين الإدارة بالنتائج الميدانية</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed font-semibold text-justify">
                    الانتقال من مجرد رصد الموازنات الورقية والصرف المالي إلى قياس الأثر الفعلي للمسارات الخمسة، والتحقق المكتبي والميداني من انتهاء الأعمال ومطابقة أطوال ومساحات عقبات الطرق المنفذة فعلياً.
                  </p>
                </div>

                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 space-y-2 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2 text-indigo-700 font-black text-xs sm:text-sm">
                    <WifiOff className="w-4.5 h-4.5" />
                    <span>٢. التشغيل في البيئات المنقطعة (Offline-First)</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed font-semibold text-justify">
                    بما أن عزل وقرى محافظة إب الجبلية الوعرة تعاني من انعدام شبكات الإنترنت والجوال، تم تزويد المنصة بنظام التخزين المحلي التلقائي، مما يتيح للفرسان تسجيل المساهمات والمخازن فوراً في الميدان دون إنترنت.
                  </p>
                </div>

                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 space-y-2 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2 text-amber-700 font-black text-xs sm:text-sm">
                    <Users className="w-4.5 h-4.5" />
                    <span>٣. تحفيز المغتربين والداعمين بالشفافية</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed font-semibold text-justify">
                    توفر المنصة وضع الزائر الآمن للقراءة فقط والذي يحمي خصوصيات المتبرعين ويخفي أرقام الهواتف، ويعرض فقط المؤشرات الإنجازية العامة، مما يبني جسور الثقة مع الداعمين بالخارج لإكمال العقبات الوعرة.
                  </p>
                </div>

                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 space-y-2 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2 text-rose-700 font-black text-xs sm:text-sm">
                    <ShieldCheck className="w-4.5 h-4.5" />
                    <span>٤. المراقبة الدقيقة وتفادي تلف الأسمنت</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed font-semibold text-justify">
                    يساعد نظام رصد وتتبع المخازن على تدوين كميات الأسمنت الموردة من وحدة التدخلات المركزية وقياس درجات مخاطر الرطوبة وسرعة النقل والتوزيع، منعاً لحدوث أي خسائر أو تلف بمواد البناء جراء الأمطار والسيول.
                  </p>
                </div>
              </div>
            </div>

            {/* تاريخ الإطلاق والمعد والمطور والاصدار */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
              {/* تاريخ الإطلاق */}
              <div className="bg-slate-50 rounded-2xl p-5 text-center space-y-2 border border-slate-100">
                <div className="w-10 h-10 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center mx-auto text-lg">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">تاريخ إطلاق المنصة رسمياً:</span>
                <p className="text-sm font-black text-slate-800">٢٩ يونيو ٢٠٢٦م</p>
                <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block">
                  تم التفعيل الميداني والتدريب ✓
                </span>
              </div>

              {/* إصدار المنصة */}
              <div className="bg-slate-50 rounded-2xl p-5 text-center space-y-2 border border-slate-100">
                <div className="w-10 h-10 bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center mx-auto text-lg">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">إصدار المنظومة التنموية:</span>
                <p className="text-sm font-black text-slate-800">إصدار مستقر v2.5.0</p>
                <span className="text-[9px] text-slate-500 font-bold block leading-none mt-1">
                  Offline-First LocalStorage Sync
                </span>
              </div>

              {/* المعد والمطور */}
              <div className="bg-slate-50 rounded-2xl p-5 text-center space-y-2 border border-emerald-600/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-600/5 rounded-bl-full pointer-events-none"></div>
                <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center mx-auto text-lg">
                  <Building className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">معد ومطور المنصة التقنية:</span>
                <p className="text-sm font-extrabold text-emerald-800 tracking-tight">م. عيسى ناجي القادري</p>
                <span className="text-[9px] text-emerald-700 font-bold bg-emerald-100/50 px-3 py-1 rounded-full inline-block border border-emerald-200/50">
                  مسؤول المتابعة والإشراف بمحافظة إب 🏅
                </span>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: الخريطة الميدانية التفاعلية GPS --- */}
        {activeMainTab === 'interactive_map' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-rose-600" />
                الخريطة الحية وتتبع الإحداثيات الجغرافية لمبادرات محافظة إب 📍
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                تتبع المواقع الميدانية وإحداثيات GPS لعقبات وطرقات ومبادرات مديريات محافظة إب
              </p>
            </div>
            <InteractiveGPSMap 
              initiatives={initiatives} 
              onSelectInitiative={(id) => {
                setSelectedInitiativeId(id);
                setActiveMainTab('initiatives');
              }} 
            />
          </div>
        )}

        {/* --- TAB: لوحة المخططات والرسوم البيانية --- */}
        {activeMainTab === 'interactive_charts' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                لوحة المخططات والرسوم البيانية التفاعلية 📈
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                تحليل النسب المئوية وتوزيع المواد والمساهمات ومستويات الإنجاز
              </p>
            </div>
            <InteractiveCharts initiatives={initiatives} />
          </div>
        )}
          </Suspense>
        )}
      </main>

      {/* 🔐 PASSCODE MODAL GATE */}
      {showPasscodeModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-fadeIn text-right" dir="rtl" id="passcode-modal">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden p-6 space-y-4 animate-scaleIn">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto text-xl">
                🔑
              </div>
              <h3 className="text-base font-black text-slate-950">إدخال رمز مرور المشرف</h3>
              <p className="text-[11px] text-slate-500">
                يرجى إدخال الرمز الخاص بك لتفعيل وضع المشرف والصلاحيات الكاملة لتعديل البيانات والعناوين.
              </p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (inputPasscode === '2525') {
                localStorage.setItem('cooperative_admin_unlocked', 'true');
                setUserRole('admin');
                setShowPasscodeModal(false);
                setInputPasscode('');
                setPasscodeError('');
              } else {
                setPasscodeError('رمز المرور الذي أدخلته غير صحيح! يرجى المحاولة مجدداً.');
              }
            }} className="space-y-3">
              <div className="space-y-1">
                <input
                  type="password"
                  required
                  placeholder="رمز المرور (مثال: ٢٥٢٥)"
                  value={inputPasscode}
                  onChange={(e) => setInputPasscode(e.target.value)}
                  className="w-full text-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold tracking-widest focus:outline-none focus:border-emerald-500 focus:bg-white"
                  autoFocus
                />
                {passcodeError && (
                  <p className="text-[10px] text-rose-600 font-bold text-center leading-relaxed">
                    ❌ {passcodeError}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasscodeModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  إلغاء الرجوع
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  تأكيد الرمز 🔓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📝 PLATFORM TITLES EDITOR MODAL */}
      {isEditingTitles && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-fadeIn text-right" dir="rtl" id="titles-editor-modal">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden p-6 space-y-4 animate-scaleIn">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="text-xl">📝</span>
              <h3 className="text-base font-black text-slate-950">تعديل عناوين المنصة الرسمية</h3>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">عنوان المنصة الرئيسي</label>
                <input
                  type="text"
                  required
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">العنوان الفرعي للمؤسسة</label>
                <textarea
                  required
                  rows={3}
                  value={tempSubtitle}
                  onChange={(e) => setTempSubtitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 leading-relaxed focus:outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditingTitles(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                إلغاء التعديل
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlatformTitle(tempTitle.trim());
                  setPlatformSubtitle(tempSubtitle.trim());
                  localStorage.setItem('platform_title', tempTitle.trim());
                  localStorage.setItem('platform_subtitle', tempSubtitle.trim());
                  setIsEditingTitles(false);
                }}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                حفظ التغييرات الرسمية ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP-BY-STEP INTERACTIVE GUIDE MODAL */}
      {showGuideModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-fadeIn text-right" dir="rtl" id="guide-modal-container">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <Compass className="w-5 h-5 text-amber-500 animate-spin-slow" />
                <div>
                  <h3 className="font-extrabold text-base">البوابة الإرشادية - دليلك خطوة بخطوة بالمنصة</h3>
                  <p className="text-[10px] text-slate-400">كيفية تشغيل المنصة، إدارة الحالات، والعمل الميداني والزوار بمحافظة إب</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable Content) */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
              {/* Steps Progress Indicator */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                {guideSteps.map((step, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveGuideStep(idx)}
                    className={`flex-1 text-center py-2 text-xs font-black transition-all border-b-2 cursor-pointer ${
                      idx === activeGuideStep
                        ? 'border-amber-500 text-slate-950 font-extrabold'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    الخطوة {idx + 1}
                  </button>
                ))}
              </div>

              {/* Step Content */}
              <div className="space-y-4 animate-fadeIn">
                <h4 className="text-base font-extrabold text-slate-900">
                  {guideSteps[activeGuideStep].title}
                </h4>
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-line text-justify bg-white border border-slate-200/60 p-5 rounded-2xl shadow-3xs">
                  {guideSteps[activeGuideStep].desc}
                </div>
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-2.5">
                  <span className="text-lg leading-none">💡</span>
                  <div>
                    <span className="text-[10px] font-black text-amber-800 uppercase block leading-none">توجيه ذكي مهم:</span>
                    <p className="text-[11px] text-amber-950 font-bold mt-1.5 leading-relaxed">
                      {guideSteps[activeGuideStep].tip}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer (Controls) */}
            <div className="p-5 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400 font-bold">
                الخطوة {activeGuideStep + 1} من {guideSteps.length}
              </span>

              <div className="flex gap-2">
                {activeGuideStep > 0 && (
                  <button
                    onClick={() => setActiveGuideStep(activeGuideStep - 1)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    السابق
                  </button>
                )}
                {activeGuideStep < guideSteps.length - 1 ? (
                  <button
                    onClick={() => setActiveGuideStep(activeGuideStep + 1)}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>التالي</span>
                    <ChevronRight className="w-3.5 h-3.5 transform rotate-180" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowGuideModal(false)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    فهمت تماماً وأريد البدء! ✓
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Texts Override Modal */}
      {isEditingCustomTexts && (() => {
        const defaultKeys = [
          { key: 'platformTitle', label: 'العنوان الرئيسي للمنصة', category: 'العناوين والتبويبات', isMultiline: false, defaultValue: 'منصة إدارة الخطة التنفيذية المتكاملة' },
          { key: 'platformSubtitle', label: 'العنوان الفرعي للمنصة', category: 'العناوين والتبويبات', isMultiline: true, defaultValue: 'وحدة التدخلات المركزية التنموية الطارئة - محافظة إب (تتبع وإدارة مبادرات الطرق المجتمعية)' },
          { key: 'tabHome', label: 'تبويب الصفحة الرئيسية', category: 'العناوين والتبويبات', isMultiline: false, defaultValue: 'الصفحة الرئيسية 🏠' },
          { key: 'tabInitiatives', label: 'تبويب سجل المبادرات والمسارات', category: 'العناوين والتبويبات', isMultiline: false, defaultValue: 'سجل المبادرات والمسارات 🚧' },
          { key: 'tabDistrictPortal', label: 'تبويب بوابات المديريات والخرائط', category: 'العناوين والتبويبات', isMultiline: false, defaultValue: 'بوابات المديريات والخرائط 🗺️' },
          { key: 'tabWorkshop', label: 'تبويب الورشة التدريبية', category: 'العناوين والتبويبات', isMultiline: false, defaultValue: 'الورشة التدريبية 💻' },
          { key: 'bannerTitle', label: 'عنوان البانر الرئيسي الترحيبي', category: 'بانر الترحيب', isMultiline: false, defaultValue: 'تفعيل مبادرات الطرق المجتمعية لمديريات محافظة إب وإدارتها بالنتائج' },
          { key: 'bannerDesc', label: 'وصف البانر والمسؤولية الكاملة', category: 'بانر الترحيب', isMultiline: true, defaultValue: 'تلتزم وحدة التدخلات المركزية التنموية الطارئة بمحافظة إب بمتابعة وتفعيل ٧٣٣ مبادرة أهلية مخصصة لرصف، شق، وتأهيل عقبات وطرقات كافة مديريات محافظة إب عبر بوابات المديريات المتكاملة. تتقسم المهام الميدانية والإشرافية على خمسة مسارات تنموية دقيقة بدءاً من التحقق والتوثيق واللجان المجتمعية، وجمع المساهمات العينية والنقدية، وحماية ومناقلة المواد، وصولاً للتحشيد الإعلامي والرقابة والفرز المكتبي لمطابقة الإنجاز بالنتائج. المطور والمعد للمنصة م. عيسى ناجي القادري مسؤول المتابعة والإشراف بمحافظة إب.' },
          { key: 'platformIntroBadge', label: 'شارة نبذة عامة وتأسيسية', category: 'الرؤية والرسالة والنبذة', isMultiline: false, defaultValue: 'نبذة عامة وتأسيسية عن المنصة' },
          { key: 'platformIntroTitle', label: 'عنوان نبذة المنصة التأسيسية', category: 'الرؤية والرسالة والنبذة', isMultiline: false, defaultValue: 'المنظومة الرقمية لإدارة الخطة التنفيذية بمحافظة إب' },
          { key: 'platformIntroDesc', label: 'تفاصيل ووصف نبذة المنصة', category: 'الرؤية والرسالة والنبذة', isMultiline: true, defaultValue: 'منصة تفاعلية رائدة متخصصة في إدارة ومتابعة وتدقيق المبادرات الأهلية لمبادرات الطرق والتمكين بمختلف عزل وقرى مديريات محافظة إب. صممت المنصة بالارتكاز على منهجية الإدارة بالنتائج، لتتجاوز التقارير الورقية التقليدية إلى تتبع حقيقي ودقيق لمراحل تفعيل المبادرات وسحب تنازلات الأراضي وإثبات الملكية المجتمعية ومتابعة مخازن الأسمنت والمواد في المناطق الوعرة التي تفتقر للإنترنت.' },
          { key: 'readMoreLink', label: 'رابط اقرأ المزيد عن الأهداف', category: 'الرؤية والرسالة والنبذة', isMultiline: false, defaultValue: 'اقرأ المزيد عن أهداف المنصة وكيفية عملها ←' },
          { key: 'visionTitle', label: 'عنوان رؤية مبادرات الطرق', category: 'الرؤية والرسالة والنبذة', isMultiline: false, defaultValue: 'رؤية مبادرات الطرق بالمحافظة:' },
          { key: 'visionDesc', label: 'تفاصيل رؤية الطرق المستدامة', category: 'الرؤية والرسالة والنبذة', isMultiline: true, defaultValue: 'الريادة في تحويل المبادرات المجتمعية لعقبات وطرق محافظة إب إلى نموذج تنموي مستدام يرتكز على الإدارة بالنتائج والمشاركة الفاعلة، لضمان وصول آمن للخدمات وفك الحصار الجغرافي عن جميع العزل والقرى الجبلية الوعرة بمحافظة إب.' },
          { key: 'missionTitle', label: 'عنوان رسالة المبادرات وأهدافها', category: 'الرؤية والرسالة والنبذة', isMultiline: false, defaultValue: 'رسالة المبادرات وأهدافها التنموية:' },
          { key: 'missionDesc', label: 'تفاصيل رسالة المبادرات', category: 'الرؤية والرسالة والنبذة', isMultiline: true, defaultValue: 'تفعيل طاقات المجتمع المحلي وإشراك المغتربين والشركاء التنمويين عبر التنسيق مع وحدة التدخلات المركزية بمحافظة إب، وتطبيق مسارات الإدارة الخمسة لضمان تنفيذ المبادرات بأعلى معايير الجودة والكفاءة، والتوثيق والفرز المستمر للأثر التنموي لمطابقة المنجز الميداني.' },
          { key: 'footerPolicy', label: 'نص سياسة العمل التنموي بالذيل', category: 'ذيل الصفحة وحقوق النشر', isMultiline: true, defaultValue: 'سياسة العمل التنموي المتكامل والإدارة بالنتائج - وحدة التدخلات المركزية التنموية الطارئة بمحافظة إب' },
          { key: 'footerCopyright', label: 'حقوق النشر والجهة المسؤولة والمعد', category: 'ذيل الصفحة وحقوق النشر', isMultiline: true, defaultValue: 'كافة الحقوق محفوظة لوحدة التدخلات المركزية بمحافظة إب • إعداد وإشراف م. عيسى ناجي القادري' }
        ];

        // Collect custom/manually added overrides
        const customKeys = Object.keys(tempOverrides)
          .filter(k => !defaultKeys.some(dk => dk.key === k))
          .map(k => ({
            key: k,
            label: `نص مخصص مضاف يدوياً: ${k}`,
            category: 'نصوص ورموز مخصصة',
            isMultiline: true,
            defaultValue: ''
          }));

        const allDisplayKeys = [...defaultKeys, ...customKeys];

        // Filter based on search query and selected category tab
        const filteredKeys = allDisplayKeys.filter(item => {
          if (activeTranslationTab !== 'all') {
            if (activeTranslationTab === 'custom') {
              if (item.category !== 'نصوص ورموز مخصصة') return false;
            } else if (item.category !== activeTranslationTab) {
              return false;
            }
          }
          if (overrideSearch.trim() !== '') {
            const q = overrideSearch.toLowerCase();
            const matchKey = item.key.toLowerCase().includes(q);
            const matchLabel = item.label.toLowerCase().includes(q);
            const matchVal = (tempOverrides[item.key] ?? item.defaultValue).toLowerCase().includes(q);
            return matchKey || matchLabel || matchVal;
          }
          return true;
        });

        const categories = [
          { id: 'all', title: 'الكل' },
          { id: 'العناوين والتبويبات', title: 'العناوين والتبويبات' },
          { id: 'بانر الترحيب', title: 'بانر الترحيب' },
          { id: 'الرؤية والرسالة والنبذة', title: 'النبذة والرؤية والرسالة' },
          { id: 'ذيل الصفحة وحقوق النشر', title: 'ذيل الصفحة' },
          { id: 'custom', title: 'نصوص مخصصة جديدة ➕' }
        ];

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" dir="rtl">
            <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
              {/* Modal Header */}
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="font-black text-sm sm:text-base">إعدادات المنصة وصلاحيات الجهات والنسخ الاحتياطي</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">ضبط الوصول للبوابات، إدارة الصلاحيات للجهات، وتنزيل النسخ الاحتياطية</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditingCustomTexts(false)}
                  className="text-slate-400 hover:text-white font-extrabold text-sm px-2.5 py-1.5 bg-slate-800 rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Navigation Sub-Tabs Bar */}
              <div className="bg-slate-950 px-6 py-2.5 border-b border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveAdminSettingsTab('entity_permissions')}
                  className={`px-4 py-2 text-xs font-black rounded-xl transition-all border cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                    activeAdminSettingsTab === 'entity_permissions'
                      ? 'bg-emerald-600 text-white border-emerald-500 font-extrabold shadow-md'
                      : 'bg-slate-900 text-slate-300 hover:text-white border-slate-800'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span>إدارة صلاحيات الجهات والبوابات (للمسؤول) 🛡️</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveAdminSettingsTab('backup_texts')}
                  className={`px-4 py-2 text-xs font-black rounded-xl transition-all border cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                    activeAdminSettingsTab === 'backup_texts'
                      ? 'bg-emerald-600 text-white border-emerald-500 font-extrabold shadow-md'
                      : 'bg-slate-900 text-slate-300 hover:text-white border-slate-800'
                  }`}
                >
                  <Database className="w-4 h-4 text-emerald-300" />
                  <span>النسخ الاحتياطي وتخصيص النصوص ⚙️</span>
                </button>
              </div>

              {activeAdminSettingsTab === 'entity_permissions' ? (
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50">
                  <EntityPermissionsManager
                    currentRole={userRole}
                    permissionsConfig={rolePermissionsConfig}
                    onSavePermissions={handleSaveRolePermissions}
                    onClose={() => setIsEditingCustomTexts(false)}
                  />
                </div>
              ) : (
                <>
                  {/* Warnings, Local Backup Card and Quick Add */}
              <div className="px-6 pt-4 space-y-3 shrink-0">
                {/* Prominent Field JSON Backup Card */}
                <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white p-4 rounded-2xl border border-emerald-500/30 shadow-xs space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black rounded-md">
                          الأرشفة الميدانية المستقلة
                        </span>
                        <h4 className="font-black text-xs sm:text-sm text-emerald-300 flex items-center gap-1.5">
                          <Database className="w-4 h-4 text-emerald-400" />
                          <span>النسخ الاحتياطي والحفظ المحلي للمبادرات</span>
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        تحميل جميع بيانات وشيتات ومسارات المبادرات ({initiatives.length} مبادرة مسجلة) في ملف JSON لتسهيل الحفظ والتوثيق اليدوي لدى المهندسين في الميدان.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleDownloadBackupJSON}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition-all shadow-xs cursor-pointer border border-emerald-400"
                        id="btn-download-json-backup"
                        title="تنزيل جميع بيانات المبادرات في ملف JSON"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تنزيل نسخة احتياطية محلية</span>
                      </button>

                      <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-all border border-slate-700 cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-slate-400" />
                        <span>استعادة JSON</span>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleRestoreBackupJSON}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingCustomTexts(false);
                          setIsApkModalOpen(true);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all border border-indigo-400 cursor-pointer"
                        title="دليل تحويل المنصة لملف APK وتثبيتها كـ PWA"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>تحويل APK 📱</span>
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl font-bold leading-relaxed">
                  💡 تلميح: يتيح لك هذا القسم تعديل مسميات المنصة، القوائم، العناوين، الرؤية، والرسالة كاملة بالنتائج، بالإضافة لتنزيل واستعادة النسخ الاحتياطية.
                </p>

                {/* Quick Search */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="🔍 ابحث عن كلمة، نص، عنوان، أو رمز معرّف..."
                      value={overrideSearch}
                      onChange={(e) => setOverrideSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-3 pl-8 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:border-emerald-500"
                    />
                    {overrideSearch && (
                      <button 
                        onClick={() => setOverrideSearch('')} 
                        className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600 font-bold text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Tabs Filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveTranslationTab(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-black whitespace-nowrap transition-all cursor-pointer ${
                        activeTranslationTab === cat.id
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {cat.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Body (Scrollable List) */}
              <div className="p-6 overflow-y-auto space-y-4 text-right flex-1 bg-slate-50/50">
                {/* Form to add custom new override key-value on the fly */}
                {activeTranslationTab === 'custom' && (
                  <div className="bg-white border border-emerald-100 p-4 rounded-2xl space-y-3 shadow-xs">
                    <div className="flex items-center gap-1.5 text-slate-800 font-black text-xs">
                      <span className="text-emerald-600">➕</span>
                      <span>إضافة نص أو معرّف مخصص جديد للمنصة:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 block">رمز النص البرمجي (بالإنجليزي وبدون مسافات):</label>
                        <input
                          type="text"
                          placeholder="مثال: mainGreeting"
                          value={newOverrideKey}
                          onChange={(e) => setNewOverrideKey(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-800 focus:bg-white focus:outline-hidden"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 block">القيمة البديلة أو النص الجديد:</label>
                        <input
                          type="text"
                          placeholder="مثال: أهلاً بكم في منصة إب"
                          value={newOverrideValue}
                          onChange={(e) => setNewOverrideValue(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-800 focus:bg-white focus:outline-hidden"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newOverrideKey || !newOverrideValue) return;
                        setTempOverrides(prev => ({ ...prev, [newOverrideKey]: newOverrideValue }));
                        setNewOverrideKey('');
                        setNewOverrideValue('');
                      }}
                      disabled={!newOverrideKey || !newOverrideValue}
                      className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl text-[10px] font-black cursor-pointer transition-all"
                    >
                      إضافة لمسودة التعديلات +
                    </button>
                  </div>
                )}

                {/* List of filtered keys */}
                {filteredKeys.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                    <p className="text-slate-400 font-bold text-xs">لا توجد نصوص تطابق معايير البحث الحالية.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredKeys.map(item => {
                      const isOverridden = tempOverrides[item.key] !== undefined;
                      const currentValue = tempOverrides[item.key] ?? item.defaultValue;
                      
                      return (
                        <div 
                          className={`bg-white border p-4 rounded-2xl shadow-3xs space-y-2 transition-all ${
                            isOverridden ? 'border-emerald-500/40 bg-emerald-50/10' : 'border-slate-200/80'
                          }`} 
                          key={item.key}
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="text-[11px] font-black text-slate-700">{item.label}</span>
                            <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">
                              {item.key}
                            </span>
                          </div>

                          {item.isMultiline ? (
                            <textarea
                              rows={3}
                              value={currentValue}
                              onChange={(e) => setTempOverrides(prev => ({ ...prev, [item.key]: e.target.value }))}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 leading-relaxed font-medium focus:bg-white focus:outline-hidden"
                            />
                          ) : (
                            <input
                              type="text"
                              value={currentValue}
                              onChange={(e) => setTempOverrides(prev => ({ ...prev, [item.key]: e.target.value }))}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:bg-white focus:outline-hidden"
                            />
                          )}

                          <div className="flex items-center justify-between pt-1 text-[10px]">
                            <button
                              type="button"
                              onClick={() => {
                                setTempOverrides(prev => {
                                  const next = { ...prev };
                                  delete next[item.key];
                                  return next;
                                });
                              }}
                              className="text-emerald-700 hover:text-emerald-900 font-black flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              🔄 استعادة القيمة الافتراضية
                            </button>

                            {item.category === 'نصوص ورموز مخصصة' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setTempOverrides(prev => {
                                    const next = { ...prev };
                                    delete next[item.key];
                                    return next;
                                  });
                                }}
                                className="text-rose-600 hover:text-rose-800 font-black flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                🗑️ حذف بالكامل
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-100 shrink-0">
                <span className="text-[10px] text-slate-500 font-bold">
                  إجمالي النصوص المعروضة: {filteredKeys.length} من {allDisplayKeys.length}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditingCustomTexts(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-black transition-all cursor-pointer"
                  >
                    تراجع وإلغاء
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const merged = { ...textOverrides };
                      
                      // Filter keys to keep custom added keys + updated default keys
                      Object.keys(tempOverrides).forEach(k => {
                        merged[k] = tempOverrides[k];
                      });
                      
                      // Also cleanup deleted keys
                      Object.keys(merged).forEach(k => {
                        if (tempOverrides[k] === undefined) {
                          delete merged[k];
                        }
                      });

                      await handleSaveAllTextOverrides(merged);
                      setIsEditingCustomTexts(false);
                    }}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs"
                  >
                    حفظ التعديلات والمزامنة 💾
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
      })()}

      {/* Unified Control Hub & Central Settings Modal */}
      <UnifiedControlHubModal
        isOpen={isControlHubOpen}
        onClose={() => setIsControlHubOpen(false)}
        userRole={userRole}
        initialTab={controlHubTab}
        platformTitle={platformTitle}
        platformSubtitle={platformSubtitle}
        onUpdateTitles={(title, subtitle) => {
          setPlatformTitle(title);
          setPlatformSubtitle(subtitle);
          localStorage.setItem('cooperative_platform_title', title);
          localStorage.setItem('cooperative_platform_subtitle', subtitle);
        }}
        isSyncing={isSyncing}
        syncTime={syncTime}
        onManualSync={handleManualSync}
        onOpenMasterExport={() => setIsMasterExportOpen(true)}
        onOpenFullPlatformPrint={() => setIsFullPlatformPrintActive(true)}
        onOpenApkModal={() => setIsApkModalOpen(true)}
        onCopyVisitorLink={handleCopyVisitorLink}
        copiedLink={copiedLink}
        onOpenGuideModal={() => {
          setActiveGuideStep(0);
          setShowGuideModal(true);
        }}
        onOpenChangelog={() => setIsChangelogOpen(true)}
        onResetData={handleResetData}
        onOpenCustomTextsModal={() => setIsEditingCustomTexts(true)}
      />

      {/* APK Conversion & Export Guide Modal */}
      <ApkExportGuideModal 
        isOpen={isApkModalOpen} 
        onClose={() => setIsApkModalOpen(false)} 
      />

      {/* Master Export PPTX & PDF Modal */}
      <MasterExportModal 
        isOpen={isMasterExportOpen} 
        onClose={() => setIsMasterExportOpen(false)} 
        initiatives={initiatives}
        knightsData={knights}
      />

      {/* Full Platform Export & Printable View */}
      {isFullPlatformPrintActive && (
        <FullPlatformPrintView
          initiatives={initiatives}
          knights={knights}
          stats={{
            total: initiatives.length,
            completed: initiatives.filter(i => i.status === 'completed').length,
            completedPct: initiatives.length > 0 ? Math.round((initiatives.filter(i => i.status === 'completed').length / initiatives.length) * 100) : 0,
            ongoing: initiatives.filter(i => i.status === 'ongoing').length,
            ongoingPct: initiatives.length > 0 ? Math.round((initiatives.filter(i => i.status === 'ongoing').length / initiatives.length) * 100) : 0,
            stagnant: initiatives.filter(i => i.status === 'stagnant').length,
            pending: initiatives.filter(i => i.status === 'pending').length,
            stopped: initiatives.filter(i => i.status === 'stopped').length,
            totalContributionsValue: initiatives.reduce((sum, i) => sum + (Number(i.communityContribution) || 0), 0),
            selfRelianceMultiplier: '3.45',
            workdaysCount: 12450
          }}
          onClose={() => setIsFullPlatformPrintActive(false)}
          onOpenApkModal={() => {
            setIsFullPlatformPrintActive(false);
            setIsApkModalOpen(true);
          }}
        />
      )}

      {/* Release V3 Changelog Modal */}
      <ReleaseChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
        onNavigateTab={(tab) => handleTabSelect(tab as any)}
      />

      {/* Humble professional Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-16 text-center text-slate-500 text-xs font-medium" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p>{t('footerPolicy', 'سياسة العمل التنموي المتكامل والإدارة بالنتائج - وحدة التدخلات المركزية التنموية الطارئة بمحافظة إب')}</p>
          <p className="text-slate-400">© {new Date().getFullYear()} {t('footerCopyright', 'كافة الحقوق محفوظة لوحدة التدخلات المركزية بمحافظة إب • إعداد وإشراف م. عيسى ناجي القادري')}</p>
        </div>
      </footer>
    </div>
  );
}
