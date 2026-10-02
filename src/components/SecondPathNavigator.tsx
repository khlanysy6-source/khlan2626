import React from 'react';
import { ArrowLeft, CheckCircle2, Database, FileCheck2, FileSpreadsheet, Flag, GitBranch, MapPinned, Search, Truck, ClipboardCheck } from 'lucide-react';
import { TabId, hasTabAccess } from '../permissions';
import { SECOND_PATH_STAGES, getStageForTab } from '../navigation/operatingModel';
import { UserRole } from '../types';

const ICONS = [Database, FileSpreadsheet, Truck, ClipboardCheck, GitBranch, FileCheck2, Flag, CheckCircle2];

type Props = { userRole: UserRole; activeTab: TabId; roleConfig: Record<string, TabId[]>; onNavigate: (tab: TabId) => void; selectedInitiative?: string | null };

export default function SecondPathNavigator({ userRole, activeTab, roleConfig, onNavigate, selectedInitiative }: Props) {
  const allowed = (tab: TabId) => hasTabAccess(userRole, tab, roleConfig);
  const activeStage = getStageForTab(activeTab);
  return <section className="second-path-shell" dir="rtl" aria-label="المسار التنفيذي الثاني">
    <div className="second-path-head">
      <div><div className="second-path-kicker">نظام التشغيل المؤسسي</div><h2>المسار التنفيذي الثاني</h2><p>البيانات تدخل من مصادرها الرسمية، تمر عبر التقييم والفرز، ثم تنتج النماذج والقرارات والمتابعة — وبعدها التحليل التنموي.</p></div>
      <div className="second-path-context">{selectedInitiative ? <><span>المبادرة الحالية</span><b>{selectedInitiative}</b></> : <><span>النمط</span><b>محفظة محافظة إب</b></>}</div>
    </div>
    <div className="second-path-rail">
      {SECOND_PATH_STAGES.map((stage, i) => {
        const Icon = ICONS[i] || Search;
        const active = activeStage?.id === stage.id || (!activeStage && i === 0 && activeTab === 'home');
        const accessible = allowed(stage.tab);
        return <React.Fragment key={stage.id}>
          <button type="button" disabled={!accessible} onClick={() => accessible && onNavigate(stage.tab)} className={`second-path-node ${active?'is-active':''} ${!accessible?'is-locked':''}`} title={stage.description}>
            <span className="second-path-number">{stage.order}</span><Icon size={17}/><span className="second-path-label">{stage.shortTitle}</span>
          </button>
          {i < SECOND_PATH_STAGES.length - 1 && <ArrowLeft className="second-path-arrow" size={15}/>} 
        </React.Fragment>;
      })}
    </div>
    {activeStage && <div className="second-path-detail">
      <div><b>{activeStage.title}</b><span>{activeStage.description}</span></div>
      <div className="second-path-sources"><span>مصادر المرحلة:</span>{activeStage.sourceSheets.slice(0,3).map(s=><em key={s}>{s}</em>)}{activeStage.sourceSheets.length>3&&<em>+{activeStage.sourceSheets.length-3}</em>}</div>
      <div className="second-path-output"><span>المخرج:</span><b>{activeStage.output}</b></div>
    </div>}
  </section>;
}
