import React from 'react';
import { ShieldAlert, Lock, ArrowRight } from 'lucide-react';
import { UserRole, ROLE_LABELS } from '../types';
import { TabId, TAB_LABELS } from '../permissions';

interface AccessDeniedCardProps {
  currentRole: UserRole;
  tabId: TabId;
  onGoHome: () => void;
}

export default function AccessDeniedCard({ currentRole, tabId, onGoHome }: AccessDeniedCardProps) {
  const roleName = ROLE_LABELS[currentRole] || currentRole;
  const tabName = TAB_LABELS[tabId] || tabId;

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6 bg-white rounded-3xl border border-rose-100 shadow-xl text-right" dir="rtl">
      <div className="max-w-md w-full space-y-5 text-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-rose-200 animate-bounce">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 text-xs font-black px-3 py-1 rounded-full border border-rose-200">
            <Lock className="w-3.5 h-3.5" />
            حجز صلاحيات الاستعراض (RBAC)
          </span>
          <h2 className="text-xl font-black text-slate-900">
            عذراً، ليس لديك صلاحية الوصول لهذه الواجهة 🔒
          </h2>
          <p className="text-xs text-slate-600 font-bold leading-relaxed">
            الواجهة المطلوبة: <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-black">{tabName}</span>
          </p>
          <p className="text-xs text-slate-500 font-medium">
            صفتك الحالية في النظام هي: <strong className="text-slate-800">{roleName}</strong>. هذه الصفحة مخصصة فقط للأدوار المصرح لها أعلى هيكلياً.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 space-y-1">
          <p className="font-bold text-slate-800">💡 ماذا يمكنك أن تفعل؟</p>
          <p>• إذا كنت تمتلك صفة قيادية أعلى، قم بالتبديل إلى الصفة المناسبة من شريط الأدوار في أعلى الشاشة.</p>
          <p>• العودة إلى الصفحة الرئيسية أو واجهة المبادرات المصرح لك بها.</p>
        </div>

        <button
          onClick={onGoHome}
          className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-black text-xs transition-all shadow-md cursor-pointer"
        >
          <ArrowRight className="w-4 h-4 transform rotate-180" />
          <span>العودة للصفحة الرئيسية 🏠</span>
        </button>
      </div>
    </div>
  );
}
