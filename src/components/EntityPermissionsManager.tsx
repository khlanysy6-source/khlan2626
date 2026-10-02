import React, { useState } from 'react';
import { UserRole, ROLE_LABELS } from '../types';
import { TabId, TAB_LABELS, ROLE_TAB_ACCESS } from '../permissions';
import { PREDEFINED_ACCOUNTS, PredefinedAccount, getAllStoredAccounts } from '../data/userAccounts';
import { 
  ShieldCheck, 
  Check, 
  X, 
  RotateCcw, 
  Save, 
  Search, 
  Building2, 
  MapPin, 
  Users, 
  Briefcase, 
  Eye, 
  Lock, 
  Sparkles,
  CloudCheck,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Mail,
  Phone,
  Layers,
  KeyRound
} from 'lucide-react';

interface EntityPermissionsManagerProps {
  currentRole: UserRole;
  permissionsConfig: Record<string, TabId[]>;
  onSavePermissions: (updatedConfig: Record<string, TabId[]>) => Promise<void>;
  onClose?: () => void;
}

interface RoleMeta {
  id: UserRole;
  label: string;
  description: string;
  icon: React.ReactNode;
  badgeBg: string;
  badgeText: string;
}

const ROLES_META: RoleMeta[] = [
  {
    id: 'central_unit',
    label: 'وحدة التدخلات المركزية (المسؤول)',
    description: 'إدارة وتتبع وتقييم كافة المبادرات وتحديد السياسات والقرارات الميدانية',
    icon: <Building2 className="w-5 h-5 text-amber-400" />,
    badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    badgeText: 'القيادة والمسؤول الرئيسي'
  },
  {
    id: 'governorate',
    label: 'السلطة المحلية بالمحافظة',
    description: 'متابعة مؤشرات إنجاز المديريات، اعتماد المسارات، والمصادقة على نتائج الفرز',
    icon: <Building2 className="w-5 h-5 text-indigo-400" />,
    badgeBg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
    badgeText: 'قيادة المحافظة'
  },
  {
    id: 'district_director',
    label: 'السلطة المحلية بالمديرية',
    description: 'متابعة المبادرات الخاصة بالمديرية، حل التعثرات، والرفع لاحتياجات الديزل والأسمنت',
    icon: <MapPin className="w-5 h-5 text-emerald-400" />,
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    badgeText: 'مديرية إب'
  },
  {
    id: 'cooperative_association',
    label: 'الجمعية التعاونية التنموية',
    description: 'تنشيط المساهمات المجتمعية، متابعة المخازن والمواد، وإشراف اللجان الميدانية',
    icon: <Users className="w-5 h-5 text-cyan-400" />,
    badgeBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
    badgeText: 'الجمعية التعاونية'
  },
  {
    id: 'engineer_inspector',
    label: 'فرسان التنمية والمهندس المشرف',
    description: 'الرفع المباشر للصور والمستندات، تقييم جاهزية الطرق، وحصر الأسمنت',
    icon: <Briefcase className="w-5 h-5 text-orange-400" />,
    badgeBg: 'bg-orange-500/10 border-orange-500/30 text-orange-300',
    badgeText: 'الميدان والهندسة'
  },
  {
    id: 'visitor',
    label: 'الزائر والعموم',
    description: 'تصفح المبادرات والخريطة التفاعلية والنتائج دون صلاحيات تعديل أو رفوعات',
    icon: <Eye className="w-5 h-5 text-slate-400" />,
    badgeBg: 'bg-slate-500/10 border-slate-500/30 text-slate-300',
    badgeText: 'تصفح عام'
  }
];

const PORTAL_CATEGORIES: { id: string; title: string; tabIds: TabId[] } = {
  id: 'all',
  title: 'جميع البوابات واللوحات',
  tabIds: [
    'home',
    'initiatives',
    'district_portal',
    'workshop',
    'advisor',
    'decision_center',
    'interactive_charts',
    'interactive_map',
    'matching_results',
    'matrix',
    'tracking_sheet',
    'field_staging',
    'sheets_import',
    'activation_plan',
    'periodic_reports',
    'engineers_portal',
    'about'
  ]
};

export const EntityPermissionsManager: React.FC<EntityPermissionsManagerProps> = ({
  currentRole,
  permissionsConfig,
  onSavePermissions,
  onClose
}) => {
  const isAdmin = currentRole === 'admin' || currentRole === 'central_unit';
  const [activeViewMode, setActiveViewMode] = useState<'matrix' | 'accounts'>('matrix');
  
  // Local editable permissions copy initialized from props or defaults
  const [localConfig, setLocalConfig] = useState<Record<string, TabId[]>>(() => {
    const initial: Record<string, TabId[]> = {};
    ROLES_META.forEach(r => {
      initial[r.id] = permissionsConfig[r.id] 
        ? [...permissionsConfig[r.id]] 
        : [...(ROLE_TAB_ACCESS[r.id] || ROLE_TAB_ACCESS.visitor)];
    });
    return initial;
  });

  const [selectedRole, setSelectedRole] = useState<UserRole>('governorate');
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const accountsList = getAllStoredAccounts();

  // Active role tab permissions array
  const currentRoleTabs = localConfig[selectedRole] || [];

  // Toggle single portal for selected role
  const handleTogglePortal = (tabId: TabId) => {
    if (!isAdmin) return;
    setLocalConfig(prev => {
      const existing = prev[selectedRole] || [];
      const isAllowed = existing.includes(tabId);
      const updatedTabs = isAllowed
        ? existing.filter(id => id !== tabId)
        : [...existing, tabId];
      return {
        ...prev,
        [selectedRole]: updatedTabs
      };
    });
  };

  // Select all portals for selected role
  const handleSelectAll = () => {
    if (!isAdmin) return;
    setLocalConfig(prev => ({
      ...prev,
      [selectedRole]: [...PORTAL_CATEGORIES.tabIds]
    }));
  };

  // Deselect all portals for selected role (except home)
  const handleDeselectAll = () => {
    if (!isAdmin) return;
    setLocalConfig(prev => ({
      ...prev,
      [selectedRole]: ['home']
    }));
  };

  // Reset selected role permissions to system default
  const handleResetRoleToDefault = () => {
    if (!isAdmin) return;
    const defaultTabs = ROLE_TAB_ACCESS[selectedRole] || ROLE_TAB_ACCESS.visitor;
    setLocalConfig(prev => ({
      ...prev,
      [selectedRole]: [...defaultTabs]
    }));
  };

  // Reset ALL roles to system defaults
  const handleResetAllToDefaults = () => {
    if (!isAdmin) return;
    if (confirm('هل أنت متأكد من إعادة ضبط كافة صلاحيات جميع الجهات إلى الإعدادات الافتراضية للنظام؟')) {
      const resetMap: Record<string, TabId[]> = {};
      ROLES_META.forEach(r => {
        resetMap[r.id] = [...(ROLE_TAB_ACCESS[r.id] || ROLE_TAB_ACCESS.visitor)];
      });
      setLocalConfig(resetMap);
    }
  };

  // Submit and save permissions to Firebase & Local Storage
  const handleSave = async () => {
    if (!isAdmin) return;
    setIsSaving(true);
    try {
      await onSavePermissions(localConfig);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3500);
    } catch (error) {
      console.error('Error saving role permissions:', error);
      alert('حدث خطأ أثناء حفظ الصلاحيات. يرجى إعادة المحاولة.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter portals list
  const filteredPortals = PORTAL_CATEGORIES.tabIds.filter(tabId => {
    const label = TAB_LABELS[tabId] || tabId;
    return label.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Filter accounts list
  const filteredAccounts = accountsList.filter(acc => {
    const q = userSearchTerm.toLowerCase();
    return (
      acc.name.toLowerCase().includes(q) ||
      acc.position.toLowerCase().includes(q) ||
      acc.organization.toLowerCase().includes(q) ||
      acc.email.toLowerCase().includes(q) ||
      acc.roleKey.toLowerCase().includes(q) ||
      acc.districtScope.toLowerCase().includes(q)
    );
  });

  const selectedRoleMeta = ROLES_META.find(r => r.id === selectedRole) || ROLES_META[1];

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
      {/* Header Bar */}
      <div className="bg-slate-950 p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-indigo-500/20 rounded-2xl border border-amber-500/30">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white">
                بوابة الحوكمة والصلاحيات المؤسسية (RBAC)
              </h3>
              <span className="px-2.5 py-0.5 bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-black rounded-md">
                12 حساباً مؤسسياً موثقاً 🛡️
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              إدارة مصفوفة وصول البوابات ودليل الحسابات الرسمية المعتمدة لوحدة التدخلات والسلطة المحلية بمحافظة إب
            </p>
          </div>
        </div>

        {/* View Mode Switcher & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveViewMode('matrix')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeViewMode === 'matrix'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>مصفوفة البوابات</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveViewMode('accounts')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeViewMode === 'accounts'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>دليل الحسابات (12)</span>
            </button>
          </div>

          {activeViewMode === 'matrix' && (
            <button
              type="button"
              onClick={handleResetAllToDefaults}
              disabled={!isAdmin}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
              title="إعادة ضبط صلاحيات جميع الجهات للقيم الافتراضية"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">الضبط الافتراضي</span>
            </button>
          )}

          {isAdmin && activeViewMode === 'matrix' && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer border border-emerald-400/50"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جاري الحفظ والمزامنة...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>حفظ ومزامنة الصلاحيات ☁️</span>
                </>
              )}
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {!isAdmin && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 p-3.5 px-6 flex items-center gap-3 shrink-0">
          <Lock className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-200 font-bold leading-relaxed">
            تنبيه: أنت تتصفح هذه الواجهة كعرض فقط. تعديل الصلاحيات متاح حصرياً لحساب المسؤول الرئيسي ورئاسة وحدة التدخلات المركزية.
          </p>
        </div>
      )}

      {/* Main Body */}
      {activeViewMode === 'matrix' ? (
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-800">
          {/* Left Side: Entities Selector Tabs */}
          <div className="w-full md:w-80 bg-slate-950/60 p-4 space-y-2 overflow-y-auto shrink-0 border-b md:border-b-0 border-slate-800">
            <div className="px-2 py-1 text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>اختر الجهة لضبط صلاحياتها:</span>
              <span className="text-amber-400 font-bold">{ROLES_META.length} جهات</span>
            </div>

            <div className="space-y-1.5">
              {ROLES_META.map(roleMeta => {
                const isSelected = selectedRole === roleMeta.id;
                const allowedCount = (localConfig[roleMeta.id] || []).length;
                return (
                  <button
                    key={roleMeta.id}
                    type="button"
                    onClick={() => setSelectedRole(roleMeta.id)}
                    className={`w-full text-right p-3.5 rounded-2xl transition-all cursor-pointer border text-xs relative ${
                      isSelected
                        ? 'bg-slate-800/90 border-amber-500/50 text-white shadow-lg ring-1 ring-amber-500/20'
                        : 'bg-slate-900/40 hover:bg-slate-800/50 border-slate-800/80 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                          {roleMeta.icon}
                        </div>
                        <div>
                          <div className="font-extrabold text-xs sm:text-sm text-slate-100">
                            {roleMeta.label}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 font-medium">
                            {roleMeta.description}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-800/60 pt-2 text-[10px]">
                      <span className={`px-2 py-0.5 rounded-md border font-extrabold ${roleMeta.badgeBg}`}>
                        {roleMeta.badgeText}
                      </span>
                      <span className="font-bold text-slate-400">
                        البوابات المفعلة: <strong className="text-emerald-400 font-black">{allowedCount}</strong> / {PORTAL_CATEGORIES.tabIds.length}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Side: Portals Grid & Toggles */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/50">
            {/* Active Entity Info Banner & Quick Controls */}
            <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white flex items-center gap-2">
                    {selectedRoleMeta.icon}
                    <span>صلاحيات الوصول لـ:</span>
                    <span className="text-amber-400">{selectedRoleMeta.label}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  قم بتفعيل أزرار التبديل للمنح أو تعطيلها للمنع. التغييرات تحفظ مباشرة وتطبق على واجهة الجهة المحددة.
                </p>
              </div>

              {/* Quick Bulk Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  disabled={!isAdmin}
                  className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                >
                  تفعيل الكل
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  disabled={!isAdmin}
                  className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                >
                  تعطيل الكل
                </button>
                <button
                  type="button"
                  onClick={handleResetRoleToDefault}
                  disabled={!isAdmin}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold transition-all cursor-pointer border border-slate-700"
                >
                  الضبط الافتراضي
                </button>
              </div>
            </div>

            {/* Search Filter Bar */}
            <div className="p-3.5 bg-slate-900/80 border-b border-slate-800 flex items-center gap-3 shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="ابحث عن اسم البوابة أو اللوحة..."
                  className="w-full pr-10 pl-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>
              <div className="text-xs text-slate-400 font-bold shrink-0">
                متاح <span className="text-amber-400 font-black">{filteredPortals.length}</span> بوابة
              </div>
            </div>

            {/* Portals Toggle Grid */}
            <div className="flex-1 p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredPortals.map(tabId => {
                const isAllowed = currentRoleTabs.includes(tabId);
                const tabTitle = TAB_LABELS[tabId] || tabId;

                return (
                  <div
                    key={tabId}
                    onClick={() => isAdmin && handleTogglePortal(tabId)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isAllowed
                        ? 'bg-slate-800/80 border-emerald-500/40 hover:border-emerald-500/70 shadow-sm'
                        : 'bg-slate-950/40 border-slate-800/60 hover:border-slate-700 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                          isAllowed
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}
                      >
                        {isAllowed ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-black text-slate-100 truncate">
                          {tabTitle}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-medium flex items-center gap-1.5">
                          <span className="font-mono text-slate-500">#{tabId}</span>
                          <span>•</span>
                          <span className={isAllowed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {isAllowed ? 'وصول مسموح ✓' : 'محظور / معطل ✕'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <div className="shrink-0">
                      <div
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer border p-0.5 ${
                          isAllowed
                            ? 'bg-emerald-600 border-emerald-400'
                            : 'bg-slate-800 border-slate-700'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform transform shadow-md ${
                            isAllowed ? 'translate-x-0' : '-translate-x-5'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Sync & Status Summary */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                <CloudCheck className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
                <span>مزامنة لحظية مباشرة عبر Firebase Firestore (`cooperative_settings/role_tab_permissions`)</span>
              </div>

              {showSuccessToast && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black rounded-xl animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم حفظ ومزامنة كافة صلاحيات الجهات بنجاح!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ACCOUNTS DIRECTORY VIEW (12 INSTITUTIONAL USERS) */
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/40">
          <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div>
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>دليل الحسابات والملفات الشخصية المؤسسية المعتمدة (User Profiles)</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                قائمة الحسابات الـ 12 ونطاق الاختصاص الجغرافي والمبادرات المسندة والمناصب الرسمية الموثقة
              </p>
            </div>

            {/* Account Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={userSearchTerm}
                onChange={e => setUserSearchTerm(e.target.value)}
                placeholder="ابحث بالاسم أو المنصب أو المديرية..."
                className="w-full pr-10 pl-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAccounts.map((acc, index) => (
              <div
                key={acc.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={acc.avatarUrl}
                      alt={acc.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0 shadow-sm"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                          #{index + 1}
                        </span>
                        <span className="bg-emerald-950 text-emerald-300 font-mono text-[10px] font-black px-2 py-0.5 rounded border border-emerald-800">
                          {acc.roleKey}
                        </span>
                      </div>
                      <h5 className="text-xs font-black text-white mt-1">
                        {acc.name}
                      </h5>
                      <span className="text-[11px] font-bold text-emerald-400 block">
                        {acc.position}
                      </span>
                    </div>
                  </div>

                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-1 rounded-lg border border-emerald-500/30 shrink-0 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>نشط 🟢</span>
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px] bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500 font-bold">الجهة:</span>
                    <span className="font-bold text-white text-right truncate max-w-[200px]">{acc.organization}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500 font-bold">المحافظة:</span>
                    <span className="font-bold text-indigo-300">{acc.governorate}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500 font-bold">نطاق المديريات:</span>
                    <span className="font-bold text-amber-300 text-right truncate max-w-[200px]">{acc.districtScope}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500 font-bold">البريد المعتمد:</span>
                    <span className="font-mono text-[10px] text-slate-400">{acc.email}</span>
                  </div>
                  {acc.assignedInitiativeIds && acc.assignedInitiativeIds.length > 0 && (
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500 font-bold">المبادرات المسندة:</span>
                      <span className="font-mono text-[10px] text-emerald-400">{acc.assignedInitiativeIds.length} مبادرة</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
