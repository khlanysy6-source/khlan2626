import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  UserCheck,
  Building2,
  MapPin,
  CheckCircle2,
  LogOut,
  ArrowRight,
  Sparkles,
  KeyRound,
  ShieldAlert,
  Users,
  Eye,
  LogIn,
  Phone
} from 'lucide-react';
import { useAuth } from '../core/auth/AuthProvider';
import { PredefinedAccount, getAllStoredAccounts } from '../data/userAccounts';

interface LoginPageProps {
  onLoginSuccess?: () => void;
  onNavigateHome?: () => void;
}

export default function LoginPage({ onLoginSuccess, onNavigateHome }: LoginPageProps) {
  const { currentUser, userProfile, signInWithEmail, logout } = useAuth();
  
  const [accountsList, setAccountsList] = useState<PredefinedAccount[]>(() => getAllStoredAccounts());
  const [searchTerm, setSearchTerm] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [selectedAccId, setSelectedAccId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const refreshAccounts = () => {
      setAccountsList(getAllStoredAccounts());
    };
    refreshAccounts();
    window.addEventListener('storage', refreshAccounts);
    return () => window.removeEventListener('storage', refreshAccounts);
  }, []);

  const filteredAccounts = accountsList.filter(acc => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.trim().toLowerCase();
    return (
      acc.name.toLowerCase().includes(term) ||
      acc.position.toLowerCase().includes(term) ||
      acc.organization.toLowerCase().includes(term) ||
      (acc.phone && acc.phone.includes(term)) ||
      acc.districtScope.toLowerCase().includes(term) ||
      acc.email.toLowerCase().includes(term)
    );
  });

  const handleSelectAccount = (acc: PredefinedAccount) => {
    setSelectedAccId(acc.id);
    setEmailInput(acc.email);
    setPasswordInput('');
    setErrorMsg(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setErrorMsg('يرجى إدخال البريد الإلكتروني للوصول إلى الحساب.');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await signInWithEmail(emailInput.trim(), passwordInput);
      setSuccessMsg(`تم تسجيل الدخول بنجاح لحساب ${emailInput}`);
      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess();
        if (onNavigateHome) onNavigateHome();
      }, 500);
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg('تعذر تسجيل الدخول. يرجى التحقق من بيانات الحساب والمحاولة مجدداً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLoginAccount = async (acc: PredefinedAccount) => {
    handleSelectAccount(acc);
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await signInWithEmail(emailInput.trim() || acc.email, passwordInput);
      setSuccessMsg(`أهلاً بك: ${acc.name} (${acc.position})`);
      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess();
        if (onNavigateHome) onNavigateHome();
      }, 600);
    } catch (err: any) {
      console.error('Quick login error:', err);
      setErrorMsg('حدث خطأ أثناء تسجيل الدخول الفوري بالحساب المحدد.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans dir-rtl text-right p-4 sm:p-8 flex flex-col justify-between">
      <div className="max-w-7xl mx-auto w-full space-y-8">
        
        {/* HEADER BAR */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-900/40 border border-emerald-400/30">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black tracking-wider text-emerald-400 uppercase bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800">
                  نظام حوكمة الحسابات والصلاحيات (RBAC V2)
                </span>
                <span className="text-[11px] font-bold text-slate-400">محافظة إب</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                بوابة تسجيل الدخول المؤسسي - وحدة التدخلات المركزية
              </h1>
            </div>
          </div>

          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              <span>العودة للمنصة العامة</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ALREADY LOGGED IN BANNER */}
        {currentUser && userProfile ? (
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <img
                  src={currentUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                  alt={currentUser.displayName || 'User'}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400 shadow-md shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full">
                      حساب مفعل وموثق 🟢
                    </span>
                    <span className="text-xs text-slate-300 font-mono">{currentUser.email}</span>
                  </div>
                  <h2 className="text-xl font-black text-white">
                    أهلاً بك: {currentUser.displayName || userProfile.name}
                  </h2>
                  <p className="text-xs text-emerald-300 font-bold">
                    {userProfile.position || userProfile.organization}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                {onNavigateHome && (
                  <button
                    onClick={onNavigateHome}
                    className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-950/50 cursor-pointer border border-emerald-400/30 transition-all flex items-center gap-2"
                  >
                    <span>الدخول لمساحة العمل المخصصة</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={async () => {
                    await logout();
                    setSuccessMsg('تم تسجيل الخروج بنجاح.');
                  }}
                  className="px-4 py-3 rounded-2xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            </div>

            {/* Scope Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-xs">
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-bold block mb-1">الجهة التابعة:</span>
                <span className="font-bold text-white">{userProfile.organization || 'وحدة التدخلات المركزية'}</span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-bold block mb-1">نطاق المسؤولية المباشرة:</span>
                <span className="font-bold text-amber-300">{userProfile.district || 'محافظة إب'}</span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-bold block mb-1">رمز الدور والتصريح:</span>
                <span className="font-mono font-bold text-emerald-400">{userProfile.role}</span>
              </div>
            </div>
          </div>
        ) : null}

        {/* LOGIN FORM AND QUICK CREDENTIALS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* FORM CARD */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="space-y-2">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <LogIn className="w-5 h-5 text-emerald-400" />
                تسجيل الدخول بالبريد الإلكتروني
              </h2>
              <p className="text-xs text-slate-400">
                أدخل البريد الإلكتروني للوصول إلى لوحة التحكم التنفيذية والقرارات.
              </p>
            </div>

            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">اسم المستخدم أو البريد الإلكتروني المعتمد:</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="e.g. unit.head أو governor أو unit_head@ebb.gov.ye"
                    className="w-full pr-10 pl-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500 transition-all text-left dir-ltr"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">كلمة المرور:</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="كلمة مرور حساب Firebase"
                    className="w-full pr-10 pl-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500 transition-all text-left dir-ltr"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-950/50 cursor-pointer border border-emerald-400/30 transition-all flex items-center justify-center gap-2 mt-4"
              >
                {isSubmitting ? (
                  <span>جاري التحقق والتوجيه...</span>
                ) : (
                  <>
                    <span>دخول الحساب وتفعيل الصلاحية</span>
                    <ShieldCheck className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5" />
                تنبيه حوكمة الحسابات:
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                بعد الدخول، يتم إلغاء القائمة المنسدلة لاختيار الدور تلقائياً، وتخضع مساحات العمل والبيانات لحسابك الحقيقي المسجل بدقة.
              </p>
            </div>
          </div>

          {/* QUICK SELECTOR CATALOG GRID (OFFICIAL ACCOUNTS FROM SHEET) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <span>دليل المستخدمين المعتمد من الشيت المرفوع</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  الأسماء الحقيقية والصفات الرسمية كما وردت في شيت المسؤولين المعتمد (مستبعد منها أي افتراض)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-950 text-emerald-300 text-xs font-black px-3 py-1.5 rounded-xl border border-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{accountsList.length} مستخدم معتمد</span>
                </span>
              </div>
            </div>

            {/* Quick Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="ابحث بالاسم، الصفة الرسمية، رقم الهاتف، أو المديرية..."
                className="w-full pr-10 pl-4 py-2.5 bg-slate-900/90 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
              />
              <Users className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 transform -translate-y-1/2" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[580px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {filteredAccounts.length === 0 ? (
                <div className="col-span-2 text-center py-8 bg-slate-900/40 rounded-2xl border border-slate-800/80 text-slate-400 text-xs">
                  لا يوجد مستخدم مطابق لمعايير البحث في الشيت المعتمد
                </div>
              ) : (
                filteredAccounts.map((acc, index) => {
                  const isSelected = selectedAccId === acc.id || currentUser?.email === acc.email;
                  return (
                    <button
                      key={acc.id}
                      onClick={() => handleQuickLoginAccount(acc)}
                      className={`p-3.5 rounded-2xl text-right transition-all cursor-pointer border flex flex-col justify-between space-y-2 relative overflow-hidden group ${
                        isSelected
                          ? 'bg-emerald-950/80 border-emerald-500 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/50'
                          : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/40 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={acc.avatarUrl}
                            alt={acc.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-700 group-hover:border-emerald-500 transition-all shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-black text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/50">
                                #{index + 1}
                              </span>
                              <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
                                {acc.position}
                              </span>
                            </div>
                            <h3 className="text-xs font-black text-white group-hover:text-emerald-300 transition-all mt-1">
                              {acc.name}
                            </h3>
                          </div>
                        </div>

                        {isSelected ? (
                          <span className="bg-emerald-500 text-slate-950 p-1 rounded-lg shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-400 transition-colors">
                            دخول ↵
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 text-[11px] border-t border-slate-800/80 pt-2 bg-slate-950/40 -mx-3.5 -mb-3.5 p-2.5 rounded-b-2xl">
                        {acc.phone && (
                          <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[10px]">
                            <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>الهاتف: {acc.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                          <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate">{acc.organization}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-amber-300/90 font-medium text-[10px]">
                          <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">{acc.districtScope}</span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

      <div className="text-center text-[11px] text-slate-500 border-t border-slate-900 pt-6 mt-8">
        وحدة التدخلات المركزية التنموية الطارئة - قيادة محافظة إب © 2026 | حوكمة الحسابات والصلاحيات (Enterprise Security Engine)
      </div>
    </div>
  );
}
