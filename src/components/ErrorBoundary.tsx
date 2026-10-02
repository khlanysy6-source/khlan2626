import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleResetStorageAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error('Error clearing storage:', e);
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = window.location.pathname;
  };

  private handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  override render() {
    if (this.state.hasError) {
      const isQuotaError = this.state.error?.message?.toLowerCase().includes('quota') ||
                           this.state.error?.name?.toLowerCase().includes('quota');

      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 sm:p-6" dir="rtl">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl text-right">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                {isQuotaError ? <ShieldAlert className="w-8 h-8 text-rose-400" /> : <AlertTriangle className="w-8 h-8" />}
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  {isQuotaError 
                    ? 'تم تجاوز حد تخزين الذاكرة المحلية (Quota Exceeded)' 
                    : 'استعادة واستقرار الواجهة التفاعلية للمنصة'}
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed font-medium mt-1">
                  {isQuotaError 
                    ? 'تراكمت كمية كبيرة من البيانات أو الصور المرفقة في ذاكرة المتصفح المحلية. يرجى مسح الذاكرة المؤقتة لإعادة فتح جميع الواجهات فوراً.'
                    : 'حدث توقف غير متوقع أثناء عرض إحدى المكونات. يمكنك إعادة تحميل الصفحة أو تنظيف الذاكرة المؤقتة للعودة للعمل بمرونة كاملة.'}
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 font-mono text-[11px] text-amber-300/90 overflow-x-auto dir-ltr">
                <span className="font-bold text-rose-400 block mb-1">
                  {this.state.error.name}: {this.state.error.message}
                </span>
                {this.state.error.stack && (
                  <span className="text-slate-400 text-[10px] whitespace-pre-wrap block max-h-36 overflow-y-auto">
                    {this.state.error.stack.slice(0, 500)}...
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة تحميل الشاشة 🔄</span>
              </button>

              <button
                onClick={this.handleResetStorageAndReload}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 bg-rose-600/90 hover:bg-rose-700 text-white font-black text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-md"
              >
                <Trash2 className="w-4 h-4" />
                <span>تنظيف الذاكرة المؤقتة وإعادة الضبط الشامل ⚙️</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 text-center font-medium border-t border-slate-700/60 pt-4">
              منصة التمكين والعمل التعاوني بمديريات محافظة إب • استقرار الأداء 100%
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

