import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  X, 
  Download, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  Terminal, 
  Check,
  Globe,
  Zap,
  ShieldCheck,
  Info
} from 'lucide-react';

interface ApkExportGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl?: string;
}

export default function ApkExportGuideModal({ isOpen, onClose, appUrl }: ApkExportGuideModalProps) {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const currentUrl = appUrl || window.location.href;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Open app in new standalone window as fallback
      window.open(currentUrl, '_blank');
    }
  };

  const handleOpenStandalone = () => {
    window.open(currentUrl, '_blank');
  };

  const capacitorSteps = `# 1. تثبيت Capacitor في مجلد المشروع
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. تهيئة التطبيق باسم ورزمة أندرويد
npx cap init "المبادرات التعاونية" "com.ibb.initiatives" --web-dir dist

# 3. بناء نسخة الويب
npm run build

# 4. إضافة منصة أندرويد وفتح المشروع في Android Studio
npx cap add android
npx cap open android

# 5. في Android Studio: اختر (Build > Build APK) لاستخراج ملف الـ APK النهائي!`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto dir-rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-indigo-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-white">تشغيل وتثبيت المنصة كتطبيق أندرويد (APK / PWA) 📱</h3>
              <p className="text-xs text-indigo-200/80 mt-0.5">تشغيل المنصة خارج استوديو جوجل كتطبيق أندرويد مستقل شبيه بتطبيقات فيسبوك</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

          {/* Quick Launch Outside Studio Hero Section */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-lg space-y-4 border border-blue-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-500/30 border border-blue-400/40 rounded-full text-blue-200 text-[10px] font-black">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  تشغيل فوري خارجي
                </div>
                <h4 className="font-black text-base text-white">تشغيل المنصة خارج أستوديو جوجل فوراً 🚀</h4>
                <p className="text-xs text-blue-200 leading-relaxed font-medium">
                  افتح المنصة في تبويب كامل مستقل بدون إطارات محاطة، لتشغيلها كتطبيق ويب مستقل وأسرع.
                </p>
              </div>

              <button
                onClick={handleOpenStandalone}
                className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 border border-emerald-400/40"
              >
                <ExternalLink className="w-4 h-4" />
                <span>فتح المنصة خارج أستوديو جوجل 🌐</span>
              </button>
            </div>
          </div>

          {/* Option 1: Instant PWA Install on Android */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-600 text-white text-[10px] font-black rounded-lg">
                  الخيار الأول (التثبيت المباشر 📲)
                </span>
                <h4 className="font-black text-sm text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>تثبيت المنصة كـ تطبيق أندرويد (PWA) على الشاشة الرئيسية</span>
                </h4>
              </div>

              {deferredPrompt && (
                <button
                  onClick={handleInstallPWA}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>تثبيت التطبيق بنقرة واحدة 📲</span>
                </button>
              )}
            </div>

            <p className="text-xs text-emerald-800 leading-relaxed font-medium">
              تطبيق المنصة يتضمن ملف تعريف التطبيقات (Web App Manifest) والعمل بدون إنترنت (Service Worker). يتيح لجميع المهندسين تشغيلها تماماً مثل تطبيق فيسبوك أو واتساب:
            </p>
            
            <ol className="list-decimal list-inside text-xs text-slate-700 space-y-2 font-bold bg-white/90 p-4 rounded-xl border border-emerald-200">
              <li>افتح رابط المنصة من متصفح Google Chrome أو Samsung Internet على جهاز الأندرويد.</li>
              <li>اضغط على قائمة الخيارات (الثلاث نقاط <code>⋮</code>) أعلى المتصفح.</li>
              <li>اختر <span className="text-emerald-700 font-extrabold">"تثبيت التطبيق" (Install App)</span> أو <span className="text-emerald-700 font-extrabold">"الإضافة إلى الشاشة الرئيسية"</span>.</li>
              <li>سيتم إنشاء أيقونة تطبيق أندرويد مستقلة بشاشة الهاتف تفتح بشاشة كاملة وبدون شريط عنوان المتصفح.</li>
            </ol>
          </div>

          {/* Option 2: Build APK via Capacitor */}
          <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-indigo-600 text-white text-[10px] font-black rounded-lg">
                  الخيار الثاني (تصدير APK رسمياً)
                </span>
                <h4 className="font-black text-sm text-indigo-300 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <span>بناء حزمة Android APK عبر Capacitor & Android Studio</span>
                </h4>
              </div>
              <button
                onClick={() => handleCopy(capacitorSteps, 'cap-steps')}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-bold rounded-lg transition-all border border-slate-700 cursor-pointer"
              >
                {copiedCmd === 'cap-steps' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCmd === 'cap-steps' ? 'تم نسخ الأوامر!' : 'نسخ أوامر البناء'}</span>
              </button>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              لتصدير حزمة <code>.apk</code> حقيقية لتوزيعها عبر الفلاشات والواتساب بدون متجر، نفذ الأوامر التالية بالمشروع:
            </p>

            <pre className="bg-slate-950 p-3.5 rounded-xl text-[11px] font-mono text-emerald-400 border border-slate-800 overflow-x-auto dir-ltr">
              {capacitorSteps}
            </pre>
          </div>

          {/* Option 3: Automatic Web2APK Converters */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-sky-600 text-white text-[10px] font-black rounded-lg">
                الخيار الثالث (مواقع التحويل السريع)
              </span>
              <h4 className="font-black text-sm text-indigo-950 flex items-center gap-1.5">
                <ExternalLink className="w-4 h-4 text-indigo-600" />
                <span>تحويل رابط المنصة أوتوماتيكياً إلى ملف APK بأدوات الـ Web2APK</span>
              </h4>
            </div>

            <p className="text-xs text-indigo-900 leading-relaxed">
              يمكنك نسخ رابط المنصة المباشر واستخدامه في أحد الخدمات المجانية لتحويل المنصة إلى ملف APK أندرويد خلال ثوانٍ:
            </p>

            <div className="bg-white p-3 rounded-xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black text-slate-500 block">رابط المنصة الخاص بك للتحويل:</span>
                <code className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 select-all block break-all">
                  {currentUrl}
                </code>
              </div>
              <button
                onClick={() => handleCopy(currentUrl, 'app-url')}
                className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer"
              >
                {copiedCmd === 'app-url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCmd === 'app-url' ? 'تم النسخ!' : 'نسخ الرابط'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <a
                href="https://pwabuilder.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-white hover:bg-indigo-50 border border-slate-200 rounded-xl transition-all group"
              >
                <div>
                  <h5 className="font-black text-xs text-slate-800 group-hover:text-indigo-700">PWABuilder (معتمد من Microsoft)</h5>
                  <p className="text-[10px] text-slate-500">يحول رابط المنصة إلى APK و Android App bundle</p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
              </a>

              <a
                href="https://gonative.io"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-white hover:bg-indigo-50 border border-slate-200 rounded-xl transition-all group"
              >
                <div>
                  <h5 className="font-black text-xs text-slate-800 group-hover:text-indigo-700">GoNative / Median.co</h5>
                  <p className="text-[10px] text-slate-500">تغليف الرابط بملف APK أندرويد أصلي بسرعة عالية</p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
              </a>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">وحدة التدخلات المركزية التنموية الطارئة - محافظة إب</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>

      </div>
    </div>
  );
}
