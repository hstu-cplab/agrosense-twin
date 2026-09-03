import React, { useState } from "react";
import { Settings, RefreshCw, CheckCircle, Bell, Shield, Sliders } from "lucide-react";
import { SystemSettings } from "../types";

interface SettingsViewProps {
  settings: SystemSettings;
  onUpdateSettings: (updated: SystemSettings) => void;
}

export default function SettingsView({ settings, onUpdateSettings }: SettingsViewProps) {
  const [calibratingKey, setCalibratingKey] = useState<string | null>(null);
  const [showSavedToast, setShowSavedToast] = useState(false);

                                                              
  const handleRecalibrate = (sensorKey: "anemometer" | "barometer" | "hygrometer") => {
    setCalibratingKey(sensorKey);
    
                                                      
    setTimeout(() => {
      const updatedCalibrationStatus = { ...settings.calibrationStatus, [sensorKey]: "optimal" as const };
      onUpdateSettings({
        ...settings,
        calibrationStatus: updatedCalibrationStatus,
      });
      setCalibratingKey(null);
      triggerToastAnimation();
    }, 1500);
  };

  const triggerToastAnimation = () => {
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
    }, 2500);
  };

  const handleToggleNotification = (key: "smsAlerts" | "emailReports" | "maintenanceReminders") => {
    const updatedNotifs = { ...settings.notifications, [key]: !settings.notifications[key] };
    onUpdateSettings({
      ...settings,
      notifications: updatedNotifs,
    });
    triggerToastAnimation();
  };

  const handleChangeUnit = (sys: "metric" | "imperial") => {
    onUpdateSettings({
      ...settings,
      unitSystem: sys,
    });
    triggerToastAnimation();
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSettings({
      ...settings,
      pollingRate: parseInt(e.target.value, 10),
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Saved Toast Alert */}
      {showSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-c-green text-on-accent font-bold py-3 px-5 rounded-lg flex items-center gap-2 shadow-2xl transition-all animate-bounce">
          <CheckCircle className="w-5 h-5" />
          <span className="font-mono text-xs uppercase tracking-wide">Settings synchronized successfully!</span>
        </div>
      )}

      {/* Top Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-hair pb-4">
        <div>
          <h1 className="font-headline text-3xl font-semibold text-ink-strong tracking-tight">
            System Operations & Configuration
          </h1>
          <p className="text-sm text-ink-muted">
            Calibrate hardware offsets, change telemetry unit models, and configure data polling.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-lg">
          <Settings className="w-4 h-4 text-accent animate-spin-slow" />
          <span className="font-mono text-xs text-accent font-bold uppercase tracking-wider">
            Operational Panel
          </span>
        </div>
      </header>

      {/* Settings Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* Left Side: General configuration */}
        <div className="space-y-6">
          <div className="bg-surface border border-hair rounded-xl p-5 shadow-lg space-y-6">
            <h3 className="font-headline text-base font-semibold text-ink-strong tracking-wider uppercase border-b border-hair pb-2 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-accent" />
              Telemetry Calibration & Units
            </h3>

            {/* Config Item 1: Unit system selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-ink-muted block uppercase tracking-wide">
                Metric System Standard
              </label>
              <p className="text-xs text-ink-muted leading-relaxed mb-2">
                Converts numbers instantly from Celsius (°C) and m/s to Fahrenheit (°F) and mph.
              </p>
              <div className="grid grid-cols-2 gap-3 p-1 bg-elev border border-hair rounded-lg">
                <button
                  type="button"
                  onClick={() => handleChangeUnit("metric")}
                  className={`py-2 text-xs font-bold rounded-md transition-all ${
                    settings.unitSystem === "metric"
                      ? "bg-accent text-on-accent shadow-md"
                      : "text-ink-muted hover:text-ink-strong"
                  }`}
                >
                  Metric Standard (S.I.)
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeUnit("imperial")}
                  className={`py-2 text-xs font-bold rounded-md transition-all ${
                    settings.unitSystem === "imperial"
                      ? "bg-accent text-on-accent shadow-md"
                      : "text-ink-muted hover:text-ink-strong"
                  }`}
                >
                  Imperial Standard (U.S.)
                </button>
              </div>
            </div>

            {/* Config Item 2: Polling Rate slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <label className="font-bold text-ink-muted uppercase tracking-wide">
                  Data Refresh Interval
                </label>
                <span className="font-mono text-accent font-bold">
                  Every {settings.pollingRate} seconds
                </span>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Determines how often the micro-anemometer and rain-bucket sensor packages report their signals.
              </p>
              <input
                type="range"
                min="1"
                max="60"
                value={settings.pollingRate}
                onChange={handleSliderChange}
                className="w-full h-1.5 bg-fill-strong rounded-lg appearance-none cursor-pointer accent-accent transition-all"
              />
            </div>

            {/* Config Item 3: Timezone */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-ink-muted block uppercase tracking-wide">
                Temporal Chronos Zone
              </label>
              <select
                className="w-full bg-elev border border-hair-strong rounded-lg py-2.5 px-3 text-xs text-ink-strong focus:border-accent focus:outline-none"
                value={settings.timezone}
                onChange={(e) => {
                  onUpdateSettings({ ...settings, timezone: e.target.value });
                  triggerToastAnimation();
                }}
              >
                <option value="UTC (Coordinated Universal Time)">UTC (Coordinated Universal Time)</option>
                <option value="EST (Eastern Standard Time)">EST (Eastern Standard Time)</option>
                <option value="PST (Pacific Standard Time)">PST (Pacific Standard Time)</option>
                <option value="GMT (Greenwich Mean Time)">GMT (Greenwich Mean Time)</option>
              </select>
            </div>
          </div>

          {/* Alarm triggers config */}
          <div className="bg-surface border border-hair rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="font-headline text-base font-semibold text-ink-strong tracking-widest uppercase border-b border-hair pb-2 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-300" />
              Notifications & Broadcasting
            </h3>

            <div className="space-y-3 pt-1">
              {/* Toggle 1: SMS */}
              <div className="flex items-center justify-between p-3 bg-elev border border-hair rounded-lg">
                <div>
                  <h4 className="text-xs font-bold text-ink-strong uppercase">Critical SMS Alarms</h4>
                  <p className="text-[10px] text-ink-muted mt-0.5">Sends emergency gales alerts to calibrated field teams.</p>
                </div>
                <button
                  onClick={() => handleToggleNotification("smsAlerts")}
                  className={`w-10 h-6 rounded-full border border-hair-strong transition-colors relative flex items-center ${
                    settings.notifications.smsAlerts ? "bg-accent" : "bg-fill-strong"
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform absolute ${
                    settings.notifications.smsAlerts ? "translate-x-5" : "translate-x-1"
                  }`} />
                </button>
              </div>

              {/* Toggle 2: Reports */}
              <div className="flex items-center justify-between p-3 bg-elev border border-hair rounded-lg">
                <div>
                  <h4 className="text-xs font-bold text-ink-strong uppercase">Daily Reports Dispatch</h4>
                  <p className="text-[10px] text-ink-muted mt-0.5">Chronicles complete 24h trend sheets to operator inbox.</p>
                </div>
                <button
                  onClick={() => handleToggleNotification("emailReports")}
                  className={`w-10 h-6 rounded-full border border-hair-strong transition-colors relative flex items-center ${
                    settings.notifications.emailReports ? "bg-accent" : "bg-fill-strong"
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform absolute ${
                    settings.notifications.emailReports ? "translate-x-5" : "translate-x-1"
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Sensor offset recalibration */}
        <div className="space-y-6">
          <div className="bg-surface border border-hair rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="font-headline text-sm font-semibold text-ink-strong tracking-widest uppercase border-b border-hair pb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-c-green" />
              Hardware Calibrations & Signals
            </h3>

            <p className="text-xs text-ink-muted leading-relaxed">
              Recalibrate remote hardware offsets to counteract dynamic instrument drift from continuous storms:
            </p>

            <div className="space-y-4 pt-2">
              {/* Sensor 1: Anemometer */}
              <div className="p-4 bg-elev border border-hair rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-ink-strong uppercase">Wind Anemometer Module</h4>
                    <span className="font-mono text-[9px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full font-bold">
                      {settings.calibrationStatus.anemometer.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[10px] text-ink-muted">Calibration baseline: {settings.calibration.anemometerBaseline} m/s offsets</p>
                </div>
                <button
                  disabled={calibratingKey === "anemometer"}
                  onClick={() => handleRecalibrate("anemometer")}
                  className="px-3.5 py-1.5 bg-fill hover:bg-fill-strong disabled:bg-accent/20 border border-hair-strong rounded-lg text-xs font-bold text-ink-strong disabled:text-accent flex items-center gap-1.5 self-start sm:self-auto uppercase tracking-wide"
                >
                  {calibratingKey === "anemometer" ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>Recalibrate</span>
                </button>
              </div>

              {/* Sensor 2: Barometer */}
              <div className="p-4 bg-elev border border-hair rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-ink-strong uppercase">Barometric Module</h4>
                    <span className="font-mono text-[9px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full font-bold">
                      {settings.calibrationStatus.barometer.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[10px] text-ink-muted">Calibration offset: {settings.calibration.barometerOffset} hPa</p>
                </div>
                <button
                  disabled={calibratingKey === "barometer"}
                  onClick={() => handleRecalibrate("barometer")}
                  className="px-3.5 py-1.5 bg-fill hover:bg-fill-strong disabled:bg-accent/20 border border-hair-strong rounded-lg text-xs font-bold text-ink-strong disabled:text-accent flex items-center gap-1.5 self-start sm:self-auto uppercase tracking-wide"
                >
                  {calibratingKey === "barometer" ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>Recalibrate</span>
                </button>
              </div>

              {/* Sensor 3: Hygrometer */}
              <div className="p-4 bg-elev border border-hair rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-ink-strong uppercase">Soil Hygrometer Arrays</h4>
                    <span
                      className={`font-mono text-[9px] px-2.5 py-0.5 rounded-full font-bold ${
                        settings.calibrationStatus.hygrometer === "optimal"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-amber-500/10 text-amber-300"
                      }`}
                    >
                      {settings.calibrationStatus.hygrometer === "requires_attention"
                        ? "UNSTABLE BASELINE"
                        : settings.calibrationStatus.hygrometer.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[10px] text-ink-muted">Signal drift error: +{settings.calibration.hygrometerDrift}% relative drift</p>
                </div>
                <button
                  disabled={calibratingKey === "hygrometer"}
                  onClick={() => handleRecalibrate("hygrometer")}
                  className="px-3.5 py-1.5 bg-fill hover:bg-fill-strong disabled:bg-c-green/20 border border-hair-strong rounded-lg text-xs font-bold text-ink-strong disabled:text-c-green flex items-center gap-1.5 self-start sm:self-auto uppercase tracking-wide"
                >
                  {calibratingKey === "hygrometer" ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>Recalibrate</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
