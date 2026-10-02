import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Database, ShieldCheck, Users } from 'lucide-react';
import { Initiative } from '../types';
import { getDirectorySummary } from '../data/officialsRegistry';

interface Props { initiatives: Initiative[]; }

export default function LeadershipDataTrustCard({ initiatives }: Props) {
  const directory = useMemo(() => getDirectorySummary(), []);
  const metrics = useMemo(() => {
    const total = initiatives.length || 1;
    const withCoordinates = initiatives.filter(i => Boolean(i.coordinates?.trim())).length;
    const withRecentUpdate = initiatives.filter(i => Boolean(i.updatedAt || i.createdAt)).length;
    const withOwner = initiatives.filter(i => Boolean(i.ownerConfirmed)).length;
    const invalidProgress = initiatives.filter(i => i.completionRate < 0 || i.completionRate > 100).length;
    return {
      location: Math.round(withCoordinates / total * 100),
      freshness: Math.round(withRecentUpdate / total * 100),
      ownership: Math.round(withOwner / total * 100),
      invalidProgress,
    };
  }, [initiatives]);

  const overall = Math.max(0, Math.min(100, Math.round((metrics.location + metrics.freshness + metrics.ownership) / 3) - metrics.invalidProgress));

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden" dir="rtl" aria-label="ثقة البيانات">
      <div className="p-5 sm:p-6 bg-gradient-to-l from-slate-950 via-slate-900 to-slate-800 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-black mb-2"><ShieldCheck size={16}/> طبقة الثقة المؤسسية</div>
            <h3 className="text-lg sm:text-xl font-black">هل يمكننا الاعتماد على هذه الصورة؟</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">مؤشرات مختصرة على اكتمال البيانات وحداثتها وتوثيق المسؤولية، قبل تحويلها إلى قرار قيادي.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 min-w-[110px]">
              <div className="text-3xl font-black">{overall}%</div>
              <div className="text-[10px] text-slate-300 font-bold">درجة الثقة الأولية</div>
            </div>
            <div className="rounded-2xl bg-emerald-400/10 border border-emerald-400/20 p-3"><Database size={24} className="text-emerald-300"/></div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 p-4 sm:p-5">
        <Metric label="الموقع" value={metrics.location} />
        <Metric label="حداثة السجل" value={metrics.freshness} />
        <Metric label="توثيق المسؤولية" value={metrics.ownership} />
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black"><Users size={14}/> الدليل المؤسسي</div>
          <div className="text-xl font-black mt-1">{directory.officials}</div>
          <div className="text-[10px] text-slate-500">مسؤول معتمد · {directory.coveredDistricts} مديرية</div>
        </div>
        <div className={`rounded-2xl border p-3 ${metrics.invalidProgress ? 'border-amber-200 bg-amber-50' : 'border-emerald-100 bg-emerald-50'}`}>
          <div className="flex items-center gap-2 text-[10px] font-black">{metrics.invalidProgress ? <AlertTriangle size={14}/> : <CheckCircle2 size={14}/>} سلامة النسب</div>
          <div className="text-xl font-black mt-1">{metrics.invalidProgress ? metrics.invalidProgress : '✓'}</div>
          <div className="text-[10px] text-slate-500">{metrics.invalidProgress ? 'سجل يحتاج مراجعة' : 'لا توجد نسب خارج 0–100'}</div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
    <div className="text-[10px] font-black text-slate-500">{label}</div>
    <div className="text-xl font-black mt-1">{value}%</div>
    <div className="mt-2 h-1.5 rounded-full bg-slate-200 overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{width: `${value}%`}} /></div>
  </div>;
}
