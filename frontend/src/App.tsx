import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Waves,
  AlertTriangle,
  Settings,
  LogOut,
  X,
  Box,
  Layers,
  Wheat,
  Bug,
  FlaskConical,
  Sun,
  Moon,
} from "lucide-react";
import { SystemSettings, OperatorProfile } from "./types";
import { INITIAL_SETTINGS, FALLBACK_AVATAR } from "./mockData";
import { auth, onAuthStateChanged } from "./firebase";
import { describeFirestoreError } from "./firestore";
import {
  logout as firebaseLogout,
  fetchUserProfile,
  updateUserProfile,
} from "./auth";

import LoginView from "./components/LoginView";
import DashboardView from "./components/DashboardView";
import SensorReadingsView from "./components/SensorReadingsView";
import SettingsView from "./components/SettingsView";
import ProfileView from "./components/ProfileView";
import DigitalTwinView from "./components/DigitalTwinView";
import ArchitectureView from "./components/ArchitectureView";
import YieldForecastView from "./components/YieldForecastView";
import DiseaseForecastView from "./components/DiseaseForecastView";
import { TwinProvider, useTwin } from "./twin/TwinProvider";
import { TAB_LAYER } from "./twin/layers";
import LayerBadge from "./components/twin/LayerBadge";
import { DEFAULT_WEATHER } from "./twin/defaults";
import { useTheme } from "./theme/ThemeProvider";
import { useI18n } from "./i18n/I18nProvider";

function ThemeLangControls() {
  const { theme, toggle: toggleTheme } = useTheme();
  const { lang, toggle: toggleLang } = useI18n();
  return (
    <>
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="w-8 h-8 rounded-lg border border-hair-strong bg-fill hover:bg-fill-strong flex items-center justify-center text-ink-muted hover:text-ink-strong transition-colors"
      >
        {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
      <button
        onClick={toggleLang}
        aria-label="Toggle language"
        className="h-8 px-2 rounded-lg border border-hair-strong bg-fill hover:bg-fill-strong flex items-center justify-center font-bold text-[11px] text-ink-muted hover:text-ink-strong transition-colors"
      >
        {lang === "en" ? "বাং" : "EN"}
      </button>
    </>
  );
}

const DEFAULT_PROFILE: OperatorProfile = {
  name: "",
  role: "",
  contact: "",
  upazilla: "",
  zila: "",
  address: "",
  email: "",
  avatar: "",
};

interface NavItem {
  id: string;
  tab: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

/** primary tabs shown in the top bar */
const TABS: NavItem[] = [
  { id: "nav-tab-architecture", tab: "architecture", label: "Architecture", icon: Layers },
  { id: "nav-tab-dashboard", tab: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "nav-tab-sensors", tab: "sensors", label: "Sensors", icon: Waves },
  { id: "nav-tab-digitaltwin", tab: "digitaltwin", label: "3D Twin", icon: Box },
  { id: "nav-tab-yield", tab: "yield", label: "Yield Forecast", icon: Wheat },
  { id: "nav-tab-disease", tab: "disease", label: "Disease Forecast", icon: Bug },
];

const ZONE_NAMES: Record<string, string> = {
  architecture: "Digital-Twin Layer Orchestration",
  dashboard: "Central Mission Control",
  sensors: "Sensor Readings & Dial Gauges",
  digitaltwin: "3D Digital Twin Station",
  yield: "Crop Yield Forecast",
  disease: "Crop Disease Forecast",
  settings: "Calibrations & operations",
  profile: "Supervisor Clearance Metrics",
};

const KNOWN_TABS = new Set([...TABS.map((t) => t.tab), "settings", "profile"]);
const TAB_ALIASES: Record<string, string> = { crops: "disease", cropintel: "yield" };

function normalizeTab(raw: string | null): string {
  if (!raw) return "architecture";
  const t = TAB_ALIASES[raw] ?? raw;
  return KNOWN_TABS.has(t) ? t : "architecture";
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [demoMode, setDemoMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("sim") === "1";
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === "undefined") return "architecture";
    return normalizeTab(new URLSearchParams(window.location.search).get("tab"));
  });
  const [dataError, setDataError] = useState<string | null>(null);

  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  const [profile, setProfile] = useState<OperatorProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthLoading(true);
      try {
        if (!user) {
          setIsLoggedIn(false);
          setProfile(DEFAULT_PROFILE);
          if (!demoMode) setDataError(null);
          return;
        }
        setIsLoggedIn(true);
        setProfile({ ...DEFAULT_PROFILE, email: user.email || "" });
        try {
          const profileData = await fetchUserProfile(user.uid);
          if (profileData) {
            setProfile({
              name: profileData.name,
              role: profileData.role || "",
              contact: profileData.phone,
              upazilla: profileData.upazilla || "",
              zila: profileData.zila || "",
              address: profileData.address || "",
              email: profileData.email || user.email || "",
              avatar: profileData.avatar || "",
            });
          }
        } catch (profileErr) {
          console.error("Failed to load operator profile from Firestore", profileErr);
          setDataError(describeFirestoreError(profileErr));
        }
      } finally {
        setAuthLoading(false);
      }
    });
    return unsubscribe;
  }, [demoMode]);

  const handleLogout = async () => {
    if (!demoMode) await firebaseLogout();
    setDemoMode(false);
    setIsLoggedIn(false);
    setActiveTab("architecture");
  };

  const handleUpdateProfile = async (updated: OperatorProfile) => {
    setProfile(updated);
    if (demoMode) return;
    const user = auth.currentUser;
    if (!user) return;
    try {
      await updateUserProfile(user.uid, {
        name: updated.name,
        role: updated.role,
        phone: updated.contact,
        upazilla: updated.upazilla,
        zila: updated.zila,
        address: updated.address,
        avatar: updated.avatar,
      });
      setDataError(null);
    } catch (err) {
      console.error("Failed to save operator profile to Firestore", err);
      setDataError(describeFirestoreError(err));
    }
  };

  if (authLoading && !demoMode) {
    return (
      <div className="min-h-screen bg-app flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full bg-accent/15 border border-accent/35 flex items-center justify-center animate-pulse">
          <span className="material-symbols-outlined text-accent text-2xl">radar</span>
        </div>
        <span className="font-mono text-xs text-accent tracking-widest uppercase">
          Establishing session...
        </span>
      </div>
    );
  }

  const active = isLoggedIn || demoMode;
  if (!active) {
    return (
      <LoginView
        onLoginSuccess={() => setIsLoggedIn(true)}
        onEnterSimulation={() => {
          setDemoMode(true);
          setAuthLoading(false);
        }}
      />
    );
  }

  return (
    <TwinProvider
      active={active}
      pollingRate={settings.pollingRate}
      calibration={settings.calibration}
      forceSimulation={demoMode}
    >
      <AppShell
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        setSettings={setSettings}
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
        onLogout={handleLogout}
        dataError={dataError}
        setDataError={setDataError}
        demoMode={demoMode}
      />
    </TwinProvider>
  );
}

interface AppShellProps {
  activeTab: string;
  setActiveTab: (t: string) => void;
  settings: SystemSettings;
  setSettings: (s: SystemSettings) => void;
  profile: OperatorProfile;
  onUpdateProfile: (p: OperatorProfile) => void;
  onLogout: () => void;
  dataError: string | null;
  setDataError: (e: string | null) => void;
  demoMode: boolean;
}

function AppShell({
  activeTab,
  setActiveTab,
  settings,
  setSettings,
  profile,
  onUpdateProfile,
  onLogout,
  dataError,
  setDataError,
  demoMode,
}: AppShellProps) {
  const { state, source, simulatedFallback, history } = useTwin();
  const { t } = useI18n();
  const weather = state?.observation ?? DEFAULT_WEATHER;
  const avatar = profile.avatar || FALLBACK_AVATAR;
  const displayName = profile.name || (demoMode ? t("Demo Operator") : t("Operator"));

  const TabButton = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.tab;
    return (
      <button
        id={item.id}
        onClick={() => setActiveTab(item.tab)}
        aria-current={isActive ? "page" : undefined}
        className={`relative flex items-center gap-2 px-3.5 h-11 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
          isActive
            ? "border-accent text-ink-strong"
            : "border-transparent text-ink-muted hover:text-ink-strong hover:border-hair-strong"
        }`}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span>{t(item.label)}</span>
        <LayerBadge layer={TAB_LAYER[item.tab]} className={isActive ? "opacity-100" : "opacity-70"} />
      </button>
    );
  };

  return (
    <div className="min-h-screen text-ink bg-app font-sans flex flex-col antialiased">
      {/* ---------- TOP BAR ---------- */}
      <header className="bg-elev border-b border-hair sticky top-0 z-30">
        {/* row 1 — identity + controls */}
        <div className="flex items-center justify-between gap-3 px-4 md:px-8 h-14">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/35 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-accent text-lg">radar</span>
            </div>
            <div className="min-w-0">
              <h2 className="font-headline text-sm font-bold tracking-wider text-ink-strong uppercase leading-tight truncate">
                {t("AgroSense Twin")}
              </h2>
              <div className="hidden sm:flex items-center gap-1.5 leading-tight">
                <span
                  className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    source === "simulation" ? "bg-c-amber" : "bg-c-green"
                  }`}
                />
                <span
                  className={`font-mono text-[9px] tracking-widest uppercase font-bold ${
                    source === "simulation" ? "text-c-amber" : "text-c-green"
                  }`}
                >
                  {source === "simulation" ? t("Simulator feed") : t("Live feed")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {demoMode && (
              <span className="hidden md:flex items-center gap-1 rounded-md border border-c-amber/30 bg-c-amber/10 px-2 py-1">
                <FlaskConical className="w-3 h-3 text-c-amber" />
                <span className="font-mono text-[9px] text-c-amber uppercase tracking-wider font-bold">
                  {t("Simulation Mode")}
                </span>
              </span>
            )}
            <ThemeLangControls />
            <button
              onClick={() => setActiveTab("settings")}
              aria-label={t("Operations Config")}
              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
                activeTab === "settings"
                  ? "border-accent text-accent bg-accent/10"
                  : "border-hair-strong bg-fill text-ink-muted hover:text-ink-strong hover:bg-fill-strong"
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              aria-label={t("Operator Profile")}
              className={`flex items-center gap-2 h-8 pl-1 pr-2.5 rounded-lg border transition-colors ${
                activeTab === "profile"
                  ? "border-accent bg-accent/10"
                  : "border-hair-strong bg-fill hover:bg-fill-strong"
              }`}
            >
              <img src={avatar} alt="" className="w-6 h-6 rounded-full object-cover border border-hair-strong" />
              <span className="hidden lg:block text-xs font-bold text-ink-strong max-w-[10rem] truncate">
                {displayName}
              </span>
            </button>
            <button
              onClick={onLogout}
              aria-label={demoMode ? t("Exit Simulation") : t("Sign Out")}
              className="w-8 h-8 rounded-lg border border-hair-strong bg-fill text-ink-muted hover:text-c-red hover:border-c-red/40 hover:bg-c-red/10 flex items-center justify-center transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* row 2 — primary tabs */}
        <nav
          aria-label="Primary"
          className="flex items-stretch gap-0.5 px-2 md:px-6 overflow-x-auto border-t border-hair"
        >
          {TABS.map((item) => (
            <TabButton key={item.id} item={item} />
          ))}
        </nav>
      </header>

      {/* ---------- MAIN ---------- */}
      <main className="flex-1 flex flex-col min-w-0 bg-app">
        {/* active-zone strip */}
        <div className="hidden md:flex items-center gap-3 px-8 h-9 border-b border-hair bg-surface-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">{t("ACTIVE ZONE:")}</span>
          <span className="font-sans text-xs font-bold text-ink-strong uppercase tracking-wider">
            {t(ZONE_NAMES[activeTab] ?? "")}
          </span>
          <LayerBadge layer={TAB_LAYER[activeTab]} variant="full" />
        </div>

        {dataError && !demoMode && (
          <div className="mx-4 md:mx-8 mt-5 rounded-xl border border-c-red/30 bg-c-red/10 px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-c-red flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-c-red uppercase tracking-wider">{t("Backend notice")}</h4>
              <p className="text-xs text-ink mt-0.5 leading-relaxed break-words">{dataError}</p>
            </div>
            <button
              onClick={() => setDataError(null)}
              aria-label="Dismiss"
              className="p-1 rounded hover:bg-fill-strong text-c-red flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {simulatedFallback && source === "simulation" && !demoMode && (
          <div className="mx-4 md:mx-8 mt-5 rounded-xl border border-c-amber/25 bg-c-amber/10 px-4 py-3 flex items-start gap-3">
            <FlaskConical className="w-4 h-4 text-c-amber flex-shrink-0 mt-0.5" />
            <p className="text-xs text-ink leading-relaxed">
              {t("No recent Firestore reading — the twin is running on the Physical-Layer simulator.")}
            </p>
          </div>
        )}

        <div className="p-4 sm:p-6 md:p-8 flex-1 max-w-7xl mx-auto w-full">
          {activeTab === "architecture" && <ArchitectureView />}
          {activeTab === "dashboard" && (
            <DashboardView weather={weather} settings={settings} onNavigateToTab={setActiveTab} twinHistory={history} />
          )}
          {activeTab === "sensors" && <SensorReadingsView weather={weather} settings={settings} />}
          {activeTab === "digitaltwin" && <DigitalTwinView />}
          {activeTab === "yield" && <YieldForecastView />}
          {activeTab === "disease" && <DiseaseForecastView weather={weather} settings={settings} />}
          {activeTab === "settings" && <SettingsView settings={settings} onUpdateSettings={setSettings} />}
          {activeTab === "profile" && <ProfileView profile={profile} onUpdateProfile={onUpdateProfile} />}
        </div>

        <footer className="bg-elev py-4 px-4 md:px-8 border-t border-hair font-mono text-[9px] text-ink-muted flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>
            TWIN LINK: {source === "simulation" ? "SIMULATOR" : "FIRESTORE"} · FIDELITY{" "}
            {state ? `${state.fidelityPct}%` : "--"} · {history.length} SAMPLES BUFFERED
          </span>
          <span className="flex items-center gap-3">
            <span>BRAC NURSERY · NILPHAMARI</span>
            <span>AGROSENSE TWIN v5.1</span>
          </span>
        </footer>
      </main>
    </div>
  );
}
