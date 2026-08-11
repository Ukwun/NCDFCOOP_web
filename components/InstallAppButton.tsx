'use client';

import { useEffect, useState } from 'react';
import { Download, Share, Smartphone, X } from 'lucide-react';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function isInstalled() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

export default function InstallAppButton() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    setInstalled(isInstalled());
    setIsIos(/iphone|ipad|ipod/i.test(window.navigator.userAgent));

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        // The website remains fully usable if installation is unsupported.
      });
    }

    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const markInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setShowHelp(false);
    };

    window.addEventListener('beforeinstallprompt', capturePrompt);
    window.addEventListener('appinstalled', markInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', capturePrompt);
      window.removeEventListener('appinstalled', markInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (installed) return;
    if (!installPrompt) {
      setShowHelp(true);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstalled(true);
    setInstallPrompt(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstall}
        disabled={installed}
        className="group inline-flex min-h-14 items-center gap-3 rounded-xl border border-white/20 bg-black px-4 py-2 text-left text-white shadow-lg transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-[#041f1a] disabled:cursor-default disabled:opacity-70 motion-reduce:transform-none"
        aria-label={installed ? 'CoopX is installed' : 'Install the CoopX app'}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-emerald-300 transition group-hover:bg-emerald-400 group-hover:text-emerald-950">
          {installed ? <Smartphone size={21} /> : <Download size={21} />}
        </span>
        <span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/65">
            {installed ? 'Available on this device' : 'Install for faster access'}
          </span>
          <span className="block text-base font-black leading-5">
            {installed ? 'CoopX App Installed' : 'Download CoopX App'}
          </span>
        </span>
      </button>

      {showHelp && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/65 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="install-help-title" onClick={() => setShowHelp(false)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-slate-950 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                {isIos ? <Share size={24} /> : <Smartphone size={24} />}
              </div>
              <button type="button" onClick={() => setShowHelp(false)} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Close installation instructions"><X size={20} /></button>
            </div>
            <h2 id="install-help-title" className="mt-5 text-2xl font-black">Install CoopX on this device</h2>
            <p className="mt-3 leading-7 text-slate-600">
              {isIos
                ? 'In Safari, tap the Share button, then choose “Add to Home Screen” and confirm Add.'
                : 'Open your browser menu and choose “Install CoopX” or “Add to Home screen”. The app will open from your device like any other app.'}
            </p>
            <button type="button" onClick={() => setShowHelp(false)} className="mt-6 w-full rounded-xl bg-emerald-900 px-5 py-3 font-bold text-white transition hover:bg-emerald-800">Got it</button>
          </div>
        </div>
      )}
    </>
  );
}
