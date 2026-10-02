/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronLeft, Home, Layers, Package, FileText, ArrowRight } from 'lucide-react';

export interface BreadcrumbItem {
  id: string;
  label: string;
  tab?: string;
  onClick?: () => void;
  active?: boolean;
}

export interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  onNavigateTab?: (tab: string) => void;
  className?: string;
}

export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  items,
  onNavigateTab,
  className = ''
}) => {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="مسار التنقل القيادي"
      className={`flex items-center gap-1.5 text-xs font-semibold py-2 px-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-600 overflow-x-auto select-none ${className}`}
    >
      <button
        type="button"
        onClick={() => {
          if (items[0]?.onClick) {
            items[0].onClick();
          } else if (onNavigateTab) {
            onNavigateTab('executive_portal');
          }
        }}
        className="flex items-center gap-1 text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer shrink-0"
        title="الرئيسية القيادية"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">الرئيسية</span>
      </button>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={item.id || index}>
            <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {isLast || item.active ? (
              <span className="font-extrabold text-emerald-900 bg-emerald-100/70 px-2 py-0.5 rounded-md truncate max-w-[200px] sm:max-w-xs shrink-0">
                {item.label}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (item.onClick) {
                    item.onClick();
                  } else if (item.tab && onNavigateTab) {
                    onNavigateTab(item.tab);
                  }
                }}
                className="hover:text-emerald-800 text-slate-600 hover:underline transition-colors truncate max-w-[150px] sm:max-w-[220px] cursor-pointer shrink-0"
              >
                {item.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default BreadcrumbNavigation;
