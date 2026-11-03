"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { btnS, Modal } from "@/components/ui";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaInstallButton() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };

    const standaloneNavigator = navigator as Navigator & { standalone?: boolean };
    setInstalled(
      window.matchMedia("(display-mode: standalone)").matches ||
      standaloneNavigator.standalone === true,
    );

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(error => {
        console.error("Sakani service worker registration failed", error);
      });
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) {
      setShowInstructions(true);
      return;
    }
    const prompt = installPrompt;
    setInstallPrompt(null);
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") setInstalled(true);
    } catch (error) {
      console.error("Sakani install prompt failed", error);
      setShowInstructions(true);
    }
  };

  return (
    <>
      {!installed && (
        <button
          type="button"
          className={btnS + " !px-2 !py-2 sm:!px-3"}
          onClick={install}
          aria-label="تثبيت تطبيق سكني"
          title="تثبيت تطبيق سكني"
        >
          <Download size={18} />
          <span className="hidden sm:inline">تثبيت التطبيق</span>
        </button>
      )}
      {showInstructions && (
        <Modal title="تثبيت تطبيق سكني" onClose={() => setShowInstructions(false)}>
          <div className="space-y-4">
            <img src="/sakani-logo.png" alt="سكني — سكن طلابي موثّق" className="mx-auto w-56 max-w-full" />
            <div className="rounded-xl bg-mint p-3">
              <h4 className="font-black text-deep">على Android</h4>
              <p className="mt-1 text-sm text-muted leading-relaxed">
                افتح الرابط في Chrome، واضغط على قائمة ⋮ ثم «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».
              </p>
            </div>
            <div className="rounded-xl bg-mint p-3">
              <h4 className="font-black text-deep">على iPhone</h4>
              <p className="mt-1 text-sm text-muted leading-relaxed">
                افتح الرابط في Safari، واضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية».
              </p>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
