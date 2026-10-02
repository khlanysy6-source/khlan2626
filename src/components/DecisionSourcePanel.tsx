import React, { useMemo } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, ClipboardCheck, Database, FileCheck2, FileText, Gavel, PackageCheck, ShieldCheck } from 'lucide-react';
import { Initiative } from '../types';
import { getDecisionsForInitiative, DecisionRecord } from '../data/decisionsStore';

type Props = {
  initiative?: Initiative | null;
  onNavigate?: (tab: string, initiativeId?: string | null, pathwayId?: number) => void;
};

type SourceRow = { label: string; source: string; value: string; state?: 'ok' | 'warn' | 'neutral' };

function value(v: unknown, fallback = 'غير متوفر في السجل الحالي') {
  if (v === undefined || v === null || String(v).trim() === '') return fallback;
  return String(v);
}

function decisionLabel(d: DecisionRecord) {
  if (d.type === 'closing') return 'إغلاق وتوثيق';
  if (d.type === 'transfer') return 'مناقلة';
  if (d.type === 'stagnation_treatment') return 'معالجة تعثر';
  return 'متابعة/إجراء مقترح';
}

export default function DecisionSourcePanel({ initiative, onNavigate }: Props) {
  const decisions = useMemo(() => initiative ? getDecisionsForInitiative(initiative.id) : [], [initiative]);
  const officialLike = decisions.filter(d => d.status !== 'pending' && d.updatedAt);

  if (!initiative) {
    return <section className="decision-source-panel" dir="rtl">
      <div className="decision-source-empty"><ShieldCheck size={22}/><b>مصدر القرار</b><span>اختر مبادرة لعرض سلسلة الأدلة ومصادر البيانات التي تُبنى عليها التوصية، ثم سجل القرار الرسمي إن وُجد.</span></div>
    </section>;
  }

  const completion = Number(initiative.completionRate) || 0;
  const rows: SourceRow[] = [
    { label: 'هوية المبادرة', source: 'السجل المرجعي للمبادرات', value: `${initiative.initiativeNumber} · ${initiative.name}`, state: 'ok' },
    { label: 'الحالة الحالية', source: 'مصفوفة الفرز', value: value(({completed:'منجزة',ongoing:'قيد التنفيذ',stagnant:'متعثر',stopped:'متوقف',pending:'لم يبدأ'} as Record<string,string>)[initiative.status] || initiative.status), state: 'ok' },
    { label: 'نسبة الإنجاز', source: 'مصفوفة مستوى الإنجاز والتقييم', value: `${completion.toFixed(1)}%`, state: completion >= 95 ? 'ok' : 'neutral' },
    { label: 'المطابقة والفروقات', source: 'مصفوفة مستوى الإنجاز والتقييم / الفرز', value: initiative.matchStatus ? `${initiative.matchStatus}${initiative.discrepancies?.length ? ` · ${initiative.discrepancies.length} فروقات` : ''}` : 'لم تُسجل حالة مطابقة', state: initiative.matchStatus === 'discrepancy' ? 'warn' : 'neutral' },
    { label: 'سبب التعثر/التوقف', source: 'مصفوفة الفرز / التقييم الميداني', value: value(initiative.stagnationReason, 'لا يوجد سبب مسجل'), state: initiative.stagnationReason ? 'warn' : 'neutral' },
    { label: 'إثبات ملكية المجتمع', source: 'سجل المبادرة', value: initiative.ownerConfirmed ? 'مؤكد' : 'غير مؤكد', state: initiative.ownerConfirmed ? 'ok' : 'warn' },
    { label: 'مواد الوحدة', source: 'سجلات الشطب/المواد المرتبطة بالمبادرة', value: `أسمنت: ${value(initiative.materialsDisbursed, '0')} من ${value(initiative.materialsApproved, '0')} · ديزل: ${value(initiative.dieselDisbursed, '0')} من ${value(initiative.dieselApproved, '0')}`, state: 'neutral' },
    { label: 'آخر تحديث للسجل', source: 'سجل المبادرة', value: value(initiative.updatedAt || initiative.createdAt), state: 'neutral' },
  ];

  const recommendation = initiative.status === 'stopped'
    ? 'إحالة المبادرة إلى مسار المناقلة/المعالجة بعد استكمال التحقق والتوثيق.'
    : initiative.status === 'stagnant'
      ? 'فتح معالجة تعثر موثقة وتحديد الإجراء والمسؤول والموعد قبل أي اعتماد.'
      : initiative.status === 'completed' || completion >= 95
        ? 'استكمال التحقق من محضر الاستلام ثم الانتقال إلى الإغلاق والأرشفة.'
        : initiative.status === 'ongoing'
          ? 'استمرار المتابعة وربط أي دعم إضافي ببيانات الإنجاز والمواد الموثقة.'
          : 'استكمال التشخيص والجاهزية قبل إصدار أي إجراء تنفيذي.';

  return <section className="decision-source-panel" dir="rtl">
    <div className="decision-source-head">
      <div><div className="decision-source-kicker"><ShieldCheck size={14}/> سلسلة القرار القابلة للتدقيق</div><h2>من أين جاءت هذه التوصية؟</h2><p>{initiative.initiativeNumber} · {initiative.name}</p></div>
      <div className="decision-source-rule"><b>قاعدة المنصة</b><span>التوصية ليست قرارًا رسميًا.</span></div>
    </div>

    <div className="decision-source-grid">
      <div className="decision-source-card source-evidence">
        <div className="decision-card-title"><Database size={17}/><div><b>المصادر والأدلة</b><span>كل قيمة مرتبطة بمصدرها التشغيلي</span></div></div>
        <div className="decision-source-rows">{rows.map((r) => <div className="decision-source-row" key={r.label}>
          <span className="decision-source-state">{r.state === 'ok' ? <CheckCircle2/> : r.state === 'warn' ? <AlertTriangle/> : <FileText/>}</span>
          <div><b>{r.label}</b><strong>{r.value}</strong><small>{r.source}</small></div>
        </div>)}</div>
      </div>

      <div className="decision-source-card source-decision">
        <div className="decision-card-title"><Gavel size={17}/><div><b>التوصية التشغيلية</b><span>ناتجة عن قراءة البيانات أعلاه</span></div></div>
        <div className="recommendation-box"><strong>{recommendation}</strong><p>هذه توصية تشغيلية للمراجعة. لا تُسجل كقرار معتمد إلا بعد إدخال القرار من صاحب الصلاحية.</p></div>
        <div className="decision-sequence"><span>1 · البيانات</span><ArrowLeft/><span>2 · التحقق</span><ArrowLeft/><span>3 · التوصية</span><ArrowLeft/><b>4 · القرار الرسمي</b></div>
        <div className="official-decision-box">
          <div><FileCheck2 size={18}/><div><b>القرار الرسمي</b><span>{officialLike.length ? 'يوجد سجل يحتاج مراجعة مصدره الرسمي' : 'لا يوجد في السجل الحالي قرار رسمي موثق هنا'}</span></div></div>
          {officialLike.length > 0 && <div className="official-decision-list">{officialLike.slice(0,3).map(d=><div key={d.id}><b>{d.decisionNumber}</b><span>{decisionLabel(d)} · {d.executionStatus}</span></div>)}</div>}
          {onNavigate && <button onClick={() => onNavigate('decision_center', initiative.id, 8)}><Gavel size={15}/> فتح سجل القرار</button>}
        </div>
      </div>
    </div>

    <div className="decision-source-footer"><PackageCheck size={15}/><span><b>مبدأ التتبع:</b> لا يجوز أن تتغير نتيجة القرار بسبب معلومة غير معروفة المصدر، ولا يجوز اعتبار أي توصية آلية قرارًا معتمدًا.</span></div>
  </section>;
}
