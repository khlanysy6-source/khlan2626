import React, { useState, useEffect } from 'react';
import { Initiative } from '../types';
import { 
  X, 
  CheckCircle2, 
  Send, 
  FileText, 
  Printer, 
  ShieldCheck, 
  AlertTriangle, 
  Calendar, 
  Users, 
  Building2, 
  Compass, 
  ArrowRight,
  Sparkles,
  Zap,
  Clock,
  Award,
  ChevronDown,
  UserCheck
} from 'lucide-react';
import { DecisionValidationGuard } from '../intelligence/DecisionValidationGuard';
import { getAllStoredOfficials, OfficialProfile } from '../data/officialsRegistry';
import { addDecision } from '../data/decisionsStore';

export type ExecutiveActionType = 'approve' | 'direct' | 'refer' | 'followup';

interface ExecutiveDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initiative: Initiative | null;
  initialActionType?: ExecutiveActionType;
  onExecuteDecision: (updatedInitiative: Initiative, successMessage: string) => void;
}

export const ExecutiveDecisionModal: React.FC<ExecutiveDecisionModalProps> = ({
  isOpen,
  onClose,
  initiative,
  initialActionType = 'direct',
  onExecuteDecision
}) => {
  if (!isOpen || !initiative) return null;

  const [selectedAction, setSelectedAction] = useState<ExecutiveActionType>(initialActionType);
  const [responsibleEntity, setResponsibleEntity] = useState<string>('');
  const [selectedOfficialId, setSelectedOfficialId] = useState<string>('');
  const [priority, setPriority] = useState<'urgent' | 'medium' | 'routine'>('urgent');
  const [decisionText, setDecisionText] = useState<string>('');
  const [followUpDate, setFollowUpDate] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [decisionCode, setDecisionCode] = useState<string>('');
  const [showPrintableDoc, setShowPrintableDoc] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [storedOfficials, setStoredOfficials] = useState<OfficialProfile[]>(() => getAllStoredOfficials());

  // Auto-fill context and default options based on initiative state and selected action
  useEffect(() => {
    if (!initiative) return;

    // Default code generator
    const code = `DEC-IBB-${new Date().getFullYear()}-${1000 + (Date.now() % 9000)}`;
    setDecisionCode(code);

    // Default follow-up date (7 days from now)
    const d = new Date();
    d.setDate(d.getDate() + (initiative.status === 'stagnant' ? 3 : 7));
    setFollowUpDate(d.toISOString().split('T')[0]);

    // Match district official if available
    const matchedOfficial = storedOfficials.find(
      o => o.district === initiative.district || o.assignedInitiativeIds?.includes(initiative.id)
    );
    if (matchedOfficial) {
      setSelectedOfficialId(matchedOfficial.id);
    }

    // Default entities based on action type
    if (selectedAction === 'approve') {
      setResponsibleEntity('وحدة التدخلات التنموية المركزية والمهندس الميداني');
      setPriority('medium');
      setDecisionText(
        `مصادقة واعتماد رسمي لإجراءات مبادرة [${initiative.name}]، وتوجيه المختصين باستكمال صرف الاعتماد المالي والمواد المعتمدة فور استيفاء شروط وحشد الرصف الحجري الجبلي.`
      );
    } else if (selectedAction === 'direct') {
      setResponsibleEntity('الجمعية التعاونية والسلطة المحلية بمديرية ' + (initiative.district || 'إب'));
      setPriority('urgent');
      setDecisionText(
        `توجيه مباشر للجمعية التعاونية والسلطة المحلية بمديرية ${initiative.district || 'إب'} بعقد اجتماع تقييمي مع اللجنة المجتمعية للوقوف على حالة المبادرة، وتأكيد جاهزية الميدان، وتقديم تقرير عاجل خلال 7 أيام.`
      );
    } else if (selectedAction === 'refer') {
      setResponsibleEntity('المهندس الفني المشرف وفرسان التنمية');
      setPriority('urgent');
      setDecisionText(
        `إحالة المبادرة للمهندس المشرف الميداني وفرسان التنمية بالمديرية لإجراء معاينة فنية فورية ومراجعة السلامة الإنشائية ومطابقة استهلاك الكميات ورفع التقرير التكميلي.`
      );
    } else {
      setResponsibleEntity('لجنة المتابعة الميدانية والنزول التقييمي');
      setPriority('medium');
      setDecisionText(
        `إدراج مبادرة [${initiative.name}] ضمن خطة المتابعة الحثيثة والنزول الميداني القادم للتحقق من انتظام الأعمال وتذليل أي عقبات لوجستية.`
      );
    }
  }, [initiative, selectedAction, storedOfficials]);

  const handleActionTabChange = (type: ExecutiveActionType) => {
    setSelectedAction(type);
  };

  const handleSubmitDecision = () => {
    if (!initiative) return;
    setValidationError(null);

    const official = storedOfficials.find(o => o.id === selectedOfficialId);

    // Decision Validation Guard check
    const validation = DecisionValidationGuard.validateDecision({
      initiativeId: initiative.id,
      initiativeName: initiative.name,
      district: initiative.district,
      currentStatus: initiative.status,
      completionPercentage: initiative.completionRate,
      decisionReason: decisionText,
      requiredAction: decisionText,
      responsibleEntity: responsibleEntity || 'الجمعية التعاونية والسلطة المحلية بالمديرية',
      priority,
      decisionStatus: 'approved',
      followUpDate: followUpDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      responsibleOfficialId: official?.id,
      responsibleOfficialName: official?.fullName,
      responsibleOfficialPhone: official?.phone
    });

    if (!validation.isValid) {
      setValidationError(validation.errors.join(' | '));
      return;
    }

    // Create updated initiative object
    const updatedExecutiveDecision = {
      requiredAction: decisionText,
      interventionPriority: priority,
      responsibleEntity: responsibleEntity || 'الجمعية التعاونية والسلطة المحلية بالمديرية',
      nextFollowUpDate: followUpDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      decisionMaker: official ? `${official.fullName} (${official.jobTitle})` : 'المدير التنفيذي للوحدة المركزية / قيادة المحافظة',
      decisionDate: new Date().toISOString().split('T')[0],
      executionStatus: 'in_execution' as const,
      decisionCode
    };

    // Add entry to monitoring timeline
    const actionLabel = {
      approve: 'اعتماد رسمي',
      direct: 'توجيه قيادي ملزم',
      refer: 'إحالة تنشيطية',
      followup: 'متابعة ميدانية'
    }[selectedAction];

    const newTimelineNode = {
      id: `TL-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      projectStatus: initiative.status === 'stagnant' ? 'قيد التدخل القيادي' : 'متابعة تنفيذية',
      actionTaken: `إصدار قرار قيادي: [${actionLabel}]`,
      responsiblePerson: official ? `${official.fullName} - ${responsibleEntity}` : (responsibleEntity || 'المدير التنفيذي للوحدة المركزية'),
      progressRate: initiative.completionRate || 0,
      notes: `${decisionText} (الرقم المرجعي: ${decisionCode})`,
      createdRole: 'executive_director'
    };

    const updatedTimeline = [newTimelineNode, ...(initiative.monitoringTimeline || [])];

    const updatedInitiative: Initiative = {
      ...initiative,
      executiveDecision: updatedExecutiveDecision,
      monitoringTimeline: updatedTimeline,
      updatedAt: new Date().toISOString()
    };

    // Save to decisionsStore
    addDecision({
      decisionNumber: decisionCode,
      title: `${actionLabel} لمبادرة (${initiative.name})`,
      initiativeId: initiative.id,
      initiativeName: initiative.name,
      district: initiative.district,
      type: selectedAction === 'approve' ? 'completed' : selectedAction === 'direct' ? 'stagnation_treatment' : 'proposed',
      status: 'approved',
      problem: initiative.status === 'stopped' || initiative.status === 'stagnant' ? (initiative.stagnationReason || 'سبب التوقف غير موثق في البيانات الحالية') : 'متابعة سير الأعمال الميدانية',
      evidence: 'سجلات النزول الميداني وجدول الكميات المعتمد بالمنصة.',
      recommendation: decisionText,
      owner: responsibleEntity,
      approvedBy: official ? `${official.fullName} (${official.jobTitle})` : 'المدير التنفيذي للوحدة المركزية',
      executionStatus: 'in_execution'
    });

    setIsSubmitted(true);
    setShowPrintableDoc(true);

    const actionSuccessLabel = {
      approve: 'اعتماد القرار والتوصية الفنية',
      direct: 'توجيه تنفيذي ملزم للمعنيين',
      refer: 'إحالة تنموية للجهة المختصة',
      followup: 'إدراج المبادرة في خطة المتابعة'
    }[selectedAction];

    onExecuteDecision(
      updatedInitiative,
      `تم إصدار وتنفيذ [${actionSuccessLabel}] برقم مرجعي (${decisionCode}) للمبادرة: ${initiative.name}`
    );
  };

  const actionDetails = {
    approve: {
      title: 'اعتماد رسمي ✅',
      desc: 'المصادقة والتعميد النهائي للتوصيات الفنية أو صرف الدفعات أو الحساب الختامي.',
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      btnBg: 'bg-emerald-600 hover:bg-emerald-500 text-white'
    },
    direct: {
      title: 'توجيه قيادي 💬',
      desc: 'إصدار أمر تنفيذي ملزم للسلطة المحلية والجمعية التعاونية واللجنة المجتمعية.',
      bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      btnBg: 'bg-amber-600 hover:bg-amber-500 text-white'
    },
    refer: {
      title: 'إحالة تنموية ↗️',
      desc: 'تحويل المبادرة للجهة المعنية (المهندس، فرسان التنمية، لجنة التحكيم) للمباشرة.',
      bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
      btnBg: 'bg-indigo-600 hover:bg-indigo-500 text-white'
    },
    followup: {
      title: 'متابعة حثيثة 🔍',
      desc: 'تكليف فريق النزول والتقييم للتحقق من الميدان وحشد جهود الرصف الحجري.',
      bg: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
      btnBg: 'bg-sky-600 hover:bg-sky-500 text-white'
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full text-slate-100 overflow-hidden relative my-auto">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-amber-500/20 text-amber-300 font-mono font-bold px-2 py-0.5 rounded-md border border-amber-500/30">
                  {decisionCode}
                </span>
                <span className="text-xs text-slate-400">إجراءات المدير التنفيذي</span>
              </div>
              <h3 className="text-base font-black text-white mt-0.5">
                {initiative.name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {!showPrintableDoc ? (
          <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
            
            {/* Initiative Brief Strip */}
            <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">المديرية / القرية:</span>
                <span className="font-bold text-white">{initiative.district || 'إب'} - {initiative.village || 'العزلة'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">حالة المبادرة:</span>
                <span className="font-bold text-amber-300">
                  {initiative.status === 'stagnant' ? 'متعثرة/توقف مؤقت' : initiative.status === 'completed' ? 'منجزة' : 'جارية التنفيذ'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">وثائق التنازلات:</span>
                <span className="font-bold text-emerald-400">مكتملة وموثقة مسبقاً 📜</span>
              </div>
            </div>

            {/* Action Tabs Selector */}
            <div>
              <label className="text-xs font-black text-slate-300 mb-2 block flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>حدد نوع القرار والإجراء القيادي المطلوب اتخاذه:</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['approve', 'direct', 'refer', 'followup'] as ExecutiveActionType[]).map((type) => {
                  const isSelected = selectedAction === type;
                  const labels = {
                    approve: 'اعتماد ✅',
                    direct: 'توجيه 💬',
                    refer: 'إحالة ↗️',
                    followup: 'متابعة 🔍'
                  };
                  return (
                    <button
                      key={type}
                      onClick={() => handleActionTabChange(type)}
                      className={`p-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer border flex flex-col items-center justify-center gap-1 ${
                        isSelected 
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg scale-[1.02]' 
                          : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      <span>{labels[type]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Action Description Banner */}
            <div className={`p-3.5 rounded-2xl border ${actionDetails[selectedAction].bg} text-xs leading-relaxed space-y-1`}>
              <div className="font-black text-sm">{actionDetails[selectedAction].title}</div>
              <p className="opacity-90">{actionDetails[selectedAction].desc}</p>
            </div>

            {/* Target Entity Assignment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-300 block flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-sky-400" />
                  <span>الجهة الموجه إليها القرار:</span>
                </label>
                <select
                  value={responsibleEntity}
                  onChange={(e) => setResponsibleEntity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold focus:border-amber-500 focus:outline-none"
                >
                  <option value="الجمعية التعاونية والسلطة المحلية بالمديرية واللجنة المجتمعية">الجمعية التعاونية والسلطة المحلية بالمديرية واللجنة المجتمعية</option>
                  <option value="السلطة المحلية بمديرية إب واللجنة المجتمعية">السلطة المحلية بمديرية إب واللجنة المجتمعية</option>
                  <option value="وحدة التدخلات التنموية المركزية بالمحافظة">وحدة التدخلات التنموية المركزية بالمحافظة</option>
                  <option value="المهندس الفني المشرف وفرسان التنمية">المهندس الفني المشرف وفرسان التنمية بالمديرية</option>
                  <option value="لجنة النزول الميداني والتقييم الفني">لجنة النزول الميداني والتقييم الفني</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-300 block flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>المسؤول المكلّف من السجل الرسمي:</span>
                </label>
                <select
                  value={selectedOfficialId}
                  onChange={(e) => setSelectedOfficialId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold focus:border-amber-500 focus:outline-none"
                >
                  <option value="">(تحديد تلقائي / مسؤول المديرية)</option>
                  {storedOfficials.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.fullName} ({o.jobTitle} - {o.district})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {validationError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Decision Text Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-300 block flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>نص التوجيه والقرار التنفيذي الصادر:</span>
                </span>
                <span className="text-[10px] text-amber-400 font-normal">قابل للتعديل المباشر</span>
              </label>
              <textarea
                rows={4}
                value={decisionText}
                onChange={(e) => setDecisionText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-slate-100 font-medium leading-relaxed focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                placeholder="أدخل نص التوجيه التنفيذي هنا..."
              />
            </div>

            {/* Priority & Deadline Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black text-slate-300 block mb-1">مستوى الأولوية والتعجيل:</label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPriority('urgent')}
                    className={`flex-1 py-2 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                      priority === 'urgent'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                        : 'bg-slate-800/40 text-slate-400 border-slate-700'
                    }`}
                  >
                    🚨 عاجل جداً
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('medium')}
                    className={`flex-1 py-2 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                      priority === 'medium'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-800/40 text-slate-400 border-slate-700'
                    }`}
                  >
                    ⚡ متوسط
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('routine')}
                    className={`flex-1 py-2 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                      priority === 'routine'
                        ? 'bg-slate-700/40 text-slate-300 border-slate-600'
                        : 'bg-slate-800/40 text-slate-400 border-slate-700'
                    }`}
                  >
                    📋 اعتيادي
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-300 block mb-1">تاريخ المتابعة والموعد النهائي:</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSubmitDecision}
                className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer shadow-lg flex items-center gap-2 ${actionDetails[selectedAction].btnBg}`}
              >
                <Send className="w-4 h-4" />
                <span>تأكيد وإصدار التوجيه القيادي 📜</span>
              </button>
            </div>

          </div>
        ) : (
          /* Official Printable Order Card View */
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="font-bold">تم تسجيل القرار القيادي بنجاح وحفظه في سجل المتابعة والسحابة!</span>
              </div>
            </div>

            {/* Printable Document Box */}
            <div className="bg-white text-slate-900 p-6 rounded-2xl border-2 border-slate-300 shadow-xl space-y-5 print:p-0 print:border-none">
              <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-black text-base text-slate-900">وحدة التدخلات التنموية المركزية - محافظة إب</h2>
                  <p className="text-xs font-bold text-slate-600">مكتب المدير التنفيذي / قيادة المحافظة</p>
                </div>
                <div className="text-left font-mono text-xs">
                  <div className="font-bold text-slate-900">الرقم المرجعي: {decisionCode}</div>
                  <div className="text-slate-600">التاريخ: {new Date().toLocaleDateString('ar-YE')}</div>
                </div>
              </div>

              <div className="text-center py-1 bg-amber-50 rounded-lg border border-amber-200">
                <h3 className="font-black text-amber-900 text-sm">
                  📜 وثيقة توجيه وقرار تنفيذي ملزم
                </h3>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-800">
                <div>
                  <strong className="text-slate-900 font-black">اسم المبادرة: </strong>
                  <span>{initiative.name}</span>
                </div>
                <div>
                  <strong className="text-slate-900 font-black">الجهة الموجه إليها: </strong>
                  <span className="font-bold text-emerald-800">{responsibleEntity}</span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <strong className="text-slate-900 font-black block mb-1">مضمون القرار والتوجيه:</strong>
                  <p className="font-medium text-slate-900 whitespace-pre-line">{decisionText}</p>
                </div>
                <div className="flex items-center justify-between text-slate-600 font-bold pt-2">
                  <span>الموعد النهائي للتنفيذ والرفع: {followUpDate}</span>
                  <span>وثائق التنازلات: مكتملة وموثقة مسبقاً 📜</span>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-300 flex items-center justify-between text-xs">
                <div className="text-center">
                  <span className="block font-bold text-slate-500">مُعد التوجيه</span>
                  <span className="font-black text-slate-900">مسؤول المتابعة والتخطيط</span>
                </div>
                <div className="text-center">
                  <span className="block font-bold text-slate-500">التوقيع والختم القيادي</span>
                  <span className="font-black text-slate-900">المدير التنفيذي للوحدة المركزية</span>
                </div>
              </div>
            </div>

            {/* Control buttons for printable view */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setShowPrintableDoc(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowRight className="w-4 h-4" />
                <span>العودة للنموذج</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الوثيقة الرسمية 🖨️</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all cursor-pointer"
                >
                  إغلاق وإنهاء ⚡
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
