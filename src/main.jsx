import React, { Suspense, useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { I18nextProvider, useTranslation } from "react-i18next";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import { ToastProvider } from "./components/ui/Toast.tsx";
import { SettingsProvider } from "./hooks/useSettings";
import { useTheme } from "./hooks/useTheme";
import { areRequiredPermissionsMet } from "./utils/permissions";
import i18n from "./i18n";
import "./index.css";

const controlPanelImport = () => import("./components/ControlPanel.tsx");
const onboardingFlowImport = () => import("./components/OnboardingFlow.tsx");
const agentOverlayImport = () => import("./components/AgentOverlay.tsx");
const permissionsGateImport = () => import("./components/PermissionsGate.tsx");
const ControlPanel = React.lazy(controlPanelImport);
const OnboardingFlow = React.lazy(onboardingFlowImport);
const AgentOverlay = React.lazy(agentOverlayImport);
const PermissionsGate = React.lazy(permissionsGateImport);
import MeetingNotificationOverlay from "./components/MeetingNotificationOverlay.tsx";
import UpdateNotificationOverlay from "./components/UpdateNotificationOverlay.tsx";

let root = null;

mountApp();

function AppRouter() {
  useTheme();
  const params = window.location.search;

  if (params.includes("meeting-notification=true")) {
    return <MeetingNotificationOverlay />;
  }

  if (params.includes("update-notification=true")) {
    return <UpdateNotificationOverlay />;
  }

  return <MainApp />;
}

function MainApp() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [needsPermissions, setNeedsPermissions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isAgentPanel = window.location.search.includes("agent=true");
  const isControlPanel =
    !isAgentPanel &&
    (window.location.pathname.includes("control") || window.location.search.includes("panel=true"));
  const isDictationPanel = !isControlPanel && !isAgentPanel;

  // Preload lazy chunks while waiting for auth so Suspense resolves instantly
  useEffect(() => {
    if (isAgentPanel) {
      agentOverlayImport().catch(() => {});
    } else if (isControlPanel) {
      controlPanelImport().catch(() => {});
      permissionsGateImport().catch(() => {});
      if (!localStorage.getItem("onboardingCompleted")) {
        onboardingFlowImport().catch(() => {});
      }
    }
  }, [isControlPanel, isAgentPanel]);

  useEffect(() => {
    const onboardingCompleted = localStorage.getItem("onboardingCompleted") === "true";

    const resolved = onboardingCompleted;

    if (isControlPanel) {
      if (!resolved) {
        setShowOnboarding(true);
      } else {
        // Check permissions from localStorage — PermissionsGate does the real async checks
        const micOk = localStorage.getItem("micPermissionGranted") === "true";
        if (!areRequiredPermissionsMet(micOk)) {
          setNeedsPermissions(true);
        }
      }
    }

    if (isDictationPanel && !resolved) {
      const rawStep = parseInt(localStorage.getItem("onboardingCurrentStep") || "0");
      const currentStep = Math.max(0, Math.min(rawStep, 5));
      if (currentStep < 4) {
        window.electronAPI?.hideWindow?.();
      }
    }

    setIsLoading(false);
  }, [isControlPanel, isDictationPanel]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setNeedsPermissions(false);
    localStorage.setItem("onboardingCompleted", "true");
  };

  const handlePermissionsComplete = () => {
    setNeedsPermissions(false);
  };

  if (isAgentPanel) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <AgentOverlay />
      </Suspense>
    );
  }

  if (isLoading) {
    return <LoadingFallback />;
  }

  // First-time user: full onboarding wizard
  if (isControlPanel && showOnboarding) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      </Suspense>
    );
  }

  // Returning user missing permissions (new machine, etc.)
  if (isControlPanel && needsPermissions) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <PermissionsGate onComplete={handlePermissionsComplete} />
      </Suspense>
    );
  }

  return isControlPanel ? (
    <Suspense fallback={<LoadingFallback />}>
      <ControlPanel />
    </Suspense>
  ) : (
    <App />
  );
}

function LoadingFallback({ message }) {
  const { t } = useTranslation();
  const fallbackMessage = message || t("common.loading");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-[scale-in_300ms_ease-out]">
        <svg
          viewBox="0 0 1024 1024"
          className="w-12 h-12 drop-shadow-[0_2px_8px_rgba(37,99,235,0.18)] dark:drop-shadow-[0_2px_12px_rgba(100,149,237,0.25)]"
          aria-label="OpenCohere"
        >
          <rect width="1024" height="1024" rx="241" fill="#2056DF" />
          <circle cx="512" cy="512" r="314" fill="#2056DF" stroke="white" strokeWidth="74" />
          <path d="M512 383V641" stroke="white" strokeWidth="74" strokeLinecap="round" />
          <path d="M627 457V568" stroke="white" strokeWidth="74" strokeLinecap="round" />
          <path d="M397 457V568" stroke="white" strokeWidth="74" strokeLinecap="round" />
        </svg>
        <div className="w-7 h-7 rounded-full border-[2.5px] border-transparent border-t-primary animate-[spinner-rotate_0.8s_cubic-bezier(0.4,0,0.2,1)_infinite] motion-reduce:animate-none motion-reduce:border-t-muted-foreground motion-reduce:opacity-50" />
        {fallbackMessage && (
          <p className="text-[13px] font-medium text-muted-foreground dark:text-foreground/60 tracking-[-0.01em]">
            {fallbackMessage}
          </p>
        )}
      </div>
    </div>
  );
}

function mountApp() {
  if (!root) {
    root = ReactDOM.createRoot(document.getElementById("root"));
  }
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <I18nextProvider i18n={i18n}>
          <SettingsProvider>
            <ToastProvider>
              <AppRouter />
            </ToastProvider>
          </SettingsProvider>
        </I18nextProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}

if (import.meta.hot) {
  import.meta.hot.accept();
}
