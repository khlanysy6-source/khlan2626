/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin, Building, Activity, Brain, FileSpreadsheet, TrendingUp, Users, ShieldCheck, FileText, ChevronRight } from 'lucide-react';
import { Initiative } from '../types';
import { TabId } from '../permissions';

interface GlobalSearchProps {
  initiatives: Initiative[];
  onSelectInitiative: (id: string) => void;
  onNavigateTab: (tab: TabId) => void;
  onSelectDistrict: (district: string) => void;
}

interface SearchResultItem {
  id: string;
  type: 'initiative' | 'district' | 'tool';
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  action: () => void;
  icon: React.ReactNode;
}

const DISTRICT_LIST = [
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
  'مديرية مذيخرة',
];

const TOOLS_LIST = [
  { tab: 'home' as TabId, title: 'مركز القيادة والتنبيهات الاستراتيجية', desc: 'لوحة القيادة والمتابعة المركزية', icon: <Building className="w-4 h-4 text-emerald-600" /> },
  { tab: 'initiatives' as TabId, title: 'سجل ومحفظة المبادرات والمسارات', desc: 'قائمة ومسارات المبادرات الـ725', icon: <Activity className="w-4 h-4 text-emerald-600" /> },
  { tab: 'district_portal' as TabId, title: 'بوابات وخرائط المديريات', desc: 'توزيع المبادرات حسب المديريات الـ20', icon: <MapPin className="w-4 h-4 text-blue-600" /> },
  { tab: 'engineers_portal' as TabId, title: 'استمارة وتقارير المهندسين الميدانية', desc: 'التقييم الفني والمعاينات الميدانية', icon: <ShieldCheck className="w-4 h-4 text-amber-600" /> },
  { tab: 'decision_center' as TabId, title: 'مركز تحليل القرار التنموي', desc: 'تحليل الجاهزية وحوكمة القرارات', icon: <Brain className="w-4 h-4 text-purple-600" /> },
  { tab: 'matrix' as TabId, title: 'مصفوفة الكميات ومقارنة الأسمنت', desc: 'مطابقة الكميات المعتمدة والمنفذة', icon: <FileSpreadsheet className="w-4 h-4 text-amber-600" /> },
  { tab: 'interactive_charts' as TabId, title: 'لوحة المخططات والرسوم البيانية', desc: 'مؤشرات الأداء والإنجاز التنموي', icon: <TrendingUp className="w-4 h-4 text-blue-600" /> },
  { tab: 'interactive_map' as TabId, title: 'الخريطة الميدانية التفاعلية GPS', desc: 'تتبع مواقع المبادرات جغرافياً', icon: <MapPin className="w-4 h-4 text-rose-600" /> },
  { tab: 'periodic_reports' as TabId, title: 'التقارير الأسبوعية والشهرية الدورية', desc: 'متابعة سير الأعمال والزيارات', icon: <FileText className="w-4 h-4 text-emerald-600" /> },
  { tab: 'officials_management' as TabId, title: 'شيت مسؤولي المديريات ونطاق الصلاحيات', desc: 'بيانات الاتصال ومسؤولي التنمية', icon: <Users className="w-4 h-4 text-indigo-600" /> },
];

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  initiatives,
  onSelectInitiative,
  onNavigateTab,
  onSelectDistrict,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter results
  const trimmed = query.trim().toLowerCase();
  const results: SearchResultItem[] = [];

  if (trimmed.length > 0) {
    // 1. Match Initiatives (up to 6)
    const matchingInits = initiatives.filter(init => {
      const name = (init.name || '').toLowerCase();
      const code = (init.initiativeNumber || '').toLowerCase();
      const dist = (init.district || '').toLowerCase();
      const subDist = (init.subDistrict || '').toLowerCase();
      const village = (init.village || '').toLowerCase();
      return name.includes(trimmed) || code.includes(trimmed) || dist.includes(trimmed) || subDist.includes(trimmed) || village.includes(trimmed);
    }).slice(0, 6);

    matchingInits.forEach(init => {
      results.push({
        id: `init-${init.id}`,
        type: 'initiative',
        title: init.name,
        subtitle: `${init.district} ${init.subDistrict ? `• عزلة ${init.subDistrict}` : ''} ${init.initiativeNumber ? `• كود #${init.initiativeNumber}` : ''}`,
        badge: init.status === 'completed' ? 'منجزة ✓' : init.status === 'ongoing' ? 'قيد التنفيذ 🚧' : init.status === 'stagnant' ? 'متعثرة ⚠️' : 'لم تبدأ ⏳',
        badgeColor: init.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : init.status === 'ongoing' ? 'bg-blue-100 text-blue-800' : init.status === 'stagnant' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700',
        action: () => {
          onSelectInitiative(init.id);
          setIsOpen(false);
          setQuery('');
        },
        icon: <Activity className="w-4 h-4 text-emerald-600 shrink-0" />,
      });
    });

    // 2. Match Districts (up to 4)
    const matchingDistricts = DISTRICT_LIST.filter(d => d.toLowerCase().includes(trimmed)).slice(0, 4);
    matchingDistricts.forEach(dist => {
      const count = initiatives.filter(i => i.district === dist).length;
      results.push({
        id: `dist-${dist}`,
        type: 'district',
        title: dist,
        subtitle: `عرض بوابات ومبادرات المديرية (${count} مبادرة)`,
        badge: 'مديرية 🏛️',
        badgeColor: 'bg-indigo-100 text-indigo-800',
        action: () => {
          onSelectDistrict(dist);
          onNavigateTab('district_portal');
          setIsOpen(false);
          setQuery('');
        },
        icon: <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />,
      });
    });

    // 3. Match Tools & Portals (up to 4)
    const matchingTools = TOOLS_LIST.filter(t => t.title.toLowerCase().includes(trimmed) || t.desc.toLowerCase().includes(trimmed)).slice(0, 4);
    matchingTools.forEach(tool => {
      results.push({
        id: `tool-${tool.tab}`,
        type: 'tool',
        title: tool.title,
        subtitle: tool.desc,
        badge: 'بوابة 🧭',
        badgeColor: 'bg-amber-100 text-amber-800',
        action: () => {
          onNavigateTab(tool.tab);
          setIsOpen(false);
          setQuery('');
        },
        icon: tool.icon,
      });
    });
  }

  // Handle keyboard navigation in list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        results[selectedIndex].action();
      }
    }
  };

  return (
    <div className="relative w-full max-w-md" id="global-search-container">
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="بحث شامل في المبادرات والمديريات والأدوات... (Ctrl+K)"
          className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-slate-900 pr-9 pl-16 py-2 rounded-xl text-xs font-bold border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-400"
          id="global-search-input"
        />
        {query ? (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute left-3 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            title="مسح البحث"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="hidden sm:inline-block absolute left-2.5 text-[9px] font-mono font-black text-slate-400 bg-slate-200/80 px-1.5 py-0.5 rounded border border-slate-300 pointer-events-none">
            Ctrl+K
          </span>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/10" 
            onClick={() => setIsOpen(false)} 
          />
          <div
            ref={dropdownRef}
            className="absolute right-0 top-full mt-2 w-full min-w-[340px] sm:min-w-[420px] max-h-96 overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-2 space-y-1 animate-fadeIn scrollbar-thin text-right"
          >
            <div className="px-3 py-1 text-[10px] font-black text-slate-400 flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1">
              <span>نتائج البحث ({results.length})</span>
              <span>استخدم الأسهم ⬆️ ⬇️ للتنقل و Enter للاختيار</span>
            </div>

            {results.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs font-medium space-y-1">
                <p>لم يتم العثور على نتائج تطابق "{query}"</p>
                <p className="text-[10px] text-slate-400">جرب البحث باسم المبادرة، كودها، أو اسم المديرية أو العزلة</p>
              </div>
            ) : (
              results.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-right p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                    selectedIndex === idx ? 'bg-emerald-50 text-emerald-950 border border-emerald-200/60 shadow-3xs' : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="p-1.5 bg-slate-100 rounded-lg shrink-0">
                      {item.icon}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-black truncate text-slate-900">{item.title}</div>
                      {item.subtitle && (
                        <div className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">{item.subtitle}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.badge && (
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 rotate-180" />
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};
