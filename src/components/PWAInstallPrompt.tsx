import React, { useState, useEffect } from 'react';
import { Download, Share, Smartphone, Monitor, Check, X, PlusSquare, ShieldCheck, AppWindow } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const checkStandalone = () => {
      const standaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const iosStandalone = (window.navigator as any).standalone === true;
      return standaloneMedia || iosStandalone;
    };

    if (checkStandalone()) {
      setIsStandalone(true);
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    // Check if user previously dismissed banner recently
    const dismissed = localStorage.getItem('pwa_prompt_dismissed_v1');
    const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
    const now = Date.now();
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    const shouldShowBannerAutomatically = !dismissedTime || (now - dismissedTime > threeDays);

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (shouldShowBannerAutomatically) {
        setShowBanner(true);
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setShowModal(false);
      setDeferredPrompt(null);
      console.log('PWA wurde erfolgreich installiert.');
    };

    // Custom event to trigger modal from header or navigation
    const handleOpenModal = () => {
      setShowModal(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('open_pwa_install_modal', handleOpenModal);

    // For iOS or browsers without beforeinstallprompt, show banner if not standalone and not dismissed
    if (shouldShowBannerAutomatically && (iosDevice || !window.matchMedia('(display-mode: standalone)').matches)) {
      const timer = setTimeout(() => {
        if (!checkStandalone()) {
          setShowBanner(true);
        }
      }, 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
        window.removeEventListener('open_pwa_install_modal', handleOpenModal);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('open_pwa_install_modal', handleOpenModal);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          console.log('PWA Installation akzeptiert');
          setIsInstalled(true);
          setShowBanner(false);
          setShowModal(false);
        } else {
          console.log('PWA Installation abgelehnt');
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Fehler bei der PWA-Installation:', err);
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  const handleDismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem('pwa_prompt_dismissed_v1', Date.now().toString());
  };

  // If already installed standalone, don't render banner
  if (isStandalone || isInstalled) {
    return null;
  }

  return (
    <>
      {/* Bottom Floating Install Banner */}
      {showBanner && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 z-50 flex flex-col space-y-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/30">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Hueber Studio App installieren</h3>
                <p className="text-xs text-slate-300">Schnellerer Zugriff & Optimierung für Ihr Gerät</p>
              </div>
            </div>
            <button
              onClick={handleDismissBanner}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Schließen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleDismissBanner}
              className="text-xs text-slate-400 hover:text-slate-200 font-medium px-2 py-1"
            >
              Später
            </button>
            <button
              onClick={handleInstallClick}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Jetzt installieren</span>
            </button>
          </div>
        </div>
      )}

      {/* Manual Install Instruction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                  <Download className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">App-Installation</h3>
                  <p className="text-xs text-slate-300">Hueber Studio auf Ihrem Startbildschirm</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 text-slate-700">
              {deferredPrompt ? (
                <div className="text-center space-y-4 py-2">
                  <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-600">
                    <Smartphone className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 text-base">Bereit zur Installation</h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Klicken Sie unten auf die Schaltfläche, um Hueber Studio als eigenständige App zu installieren.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await deferredPrompt.prompt();
                        const choice = await deferredPrompt.userChoice;
                        if (choice.outcome === 'accepted') {
                          setShowModal(false);
                          setShowBanner(false);
                          setIsInstalled(true);
                        }
                      } catch (e) {
                        console.error('Install error:', e);
                      }
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>App sofort installieren</span>
                  </button>
                </div>
              ) : isIOS ? (
                /* iOS Instructions */
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-indigo-900 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                    <Smartphone className="w-5 h-5 text-indigo-600 shrink-0" />
                    <span className="text-xs font-semibold">
                      Anleitung für iPhone & iPad (Safari)
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">1</span>
                      <div>
                        <p className="font-semibold text-slate-800">Tippen Sie auf das Teilen-Symbol</p>
                        <p className="text-slate-500 mt-0.5 flex items-center space-x-1">
                          <span>Unten in der Safari-Menüleiste auf</span>
                          <span className="inline-flex items-center bg-white px-1.5 py-0.5 rounded border border-slate-300 font-bold text-indigo-600">
                            <Share className="w-3 h-3 mr-1" /> Teilen
                          </span>
                          <span>tippen.</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">2</span>
                      <div>
                        <p className="font-semibold text-slate-800">Wählen Sie "Zum Home-Bildschirm"</p>
                        <p className="text-slate-500 mt-0.5 flex items-center space-x-1">
                          <span>In der Liste nach unten scrollen und auf</span>
                          <span className="inline-flex items-center bg-white px-1.5 py-0.5 rounded border border-slate-300 font-bold text-slate-800">
                            <PlusSquare className="w-3 h-3 mr-1 text-indigo-600" /> Zum Home-Bildschirm
                          </span>
                          <span>tippen.</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">3</span>
                      <div>
                        <p className="font-semibold text-slate-800">Bestätigen Sie mit "Hinzufügen"</p>
                        <p className="text-slate-500 mt-0.5">
                          Tippen Sie oben rechts auf <strong className="text-indigo-600 font-bold">Hinzufügen</strong>, um die App auf Ihrem Home-Bildschirm zu platzieren.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Desktop / Android General Instructions */
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-indigo-900 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                    <Monitor className="w-5 h-5 text-indigo-600 shrink-0" />
                    <span className="text-xs font-semibold">
                      Anleitung für Chrome, Edge & Android
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">1</span>
                      <div>
                        <p className="font-semibold text-slate-800">Browser-Menü öffnen oder Installationssymbol nutzen</p>
                        <p className="text-slate-500 mt-0.5">
                          Klicken Sie in der Adresszeile oben rechts auf das <strong className="text-indigo-600 font-bold">Installieren-Symbol (⬇)</strong> oder öffnen Sie das 3-Punkte-Menü des Browsers.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">2</span>
                      <div>
                        <p className="font-semibold text-slate-800">Wählen Sie "App installieren"</p>
                        <p className="text-slate-500 mt-0.5">
                          Klicken Sie auf <strong className="text-slate-800 font-bold">"Hueber Studio installieren"</strong> oder <strong className="text-slate-800 font-bold">"App zum Startbildschirm hinzufügen"</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">3</span>
                      <div>
                        <p className="font-semibold text-slate-800">Direkter Zugriff</p>
                        <p className="text-slate-500 mt-0.5">
                          Die App startet künftig im schnellen Vollbildmodus direkt von Ihrem Desktop oder Smartphone-Homescreen.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Benefits */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Vollbildmodus & Offline-Caches</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Schnellstart</span>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-xs transition-colors"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function PWAInstallButton({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const standaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const iosStandalone = (window.navigator as any).standalone === true;
      return standaloneMedia || iosStandalone;
    };
    if (checkStandalone()) {
      setIsStandalone(true);
    }
  }, []);

  if (isStandalone) {
    return null;
  }

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('open_pwa_install_modal'));
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${className}`}
        title="App auf Home-Bildschirm installieren"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">App installieren</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors ${className}`}
      title="App auf Home-Bildschirm installieren"
    >
      <AppWindow className="w-3.5 h-3.5" />
      <span>App installieren</span>
    </button>
  );
}
